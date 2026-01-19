# Company Obligations Integration - Implementation Summary

## Overview
Successfully integrated PIN checker automation to fetch company tax obligations for PINs starting with "P", allowing users to select which obligations to file nil returns for in the UI.

## Changes Made

### 1. New API Endpoint: `/api/company/check-obligations`
**File:** `app/api/company/check-obligations/route.js`

- **Purpose:** Fetches tax obligations for company PINs using PIN checker automation
- **Features:**
  - Validates PIN starts with 'P' (company PIN)
  - Launches browser automation to login to KRA PIN Checker
  - Extracts obligation details from KRA portal
  - Returns active obligations with their IDs and statuses
  - Maps obligations to UI-friendly format with obligation IDs:
    - Income Tax - PAYE: ID `7`
    - Value Added Tax (VAT): ID `9`
    - Income Tax - Company: ID `4`
    - Income Tax - Rent Income (MRI): ID `5`
    - Income Tax - Resident Individual: ID `1`
    - Income Tax - Turnover Tax: ID `8`

**Request:**
```json
{
  "pin": "P051234567A"
}
```

**Response:**
```json
{
  "success": true,
  "pin": "P051234567A",
  "taxpayerName": "COMPANY NAME LTD",
  "pinStatus": "Active",
  "itaxStatus": "Active",
  "obligations": [
    {
      "id": "7",
      "name": "Income Tax - PAYE",
      "status": "Active",
      "effectiveFrom": "01/01/2020",
      "effectiveTo": "Active"
    },
    {
      "id": "9",
      "name": "Value Added Tax (VAT)",
      "status": "Active",
      "effectiveFrom": "01/01/2020",
      "effectiveTo": "Active"
    }
  ]
}
```

### 2. Updated Company Route: `/api/company`
**File:** `app/api/company/route.js`

**Changes:**
- Modified `navigateToFileReturn` function to accept `obligationId` parameter (defaults to '7')
- Updated POST handler to accept `obligation_id` from request body
- Uses selected obligation ID when filing nil return
- Returns obligation_id in response for tracking

**Usage:**
```javascript
// Request body now includes obligation_id
{
  "company_name": "COMPANY NAME LTD",
  "kra_pin": "P051234567A",
  "kra_password": "password123",
  "session_id": "session-uuid",
  "return_id": "return-uuid",
  "obligation_id": "9"  // NEW: VAT obligation
}
```

### 3. New UI Component: `CompanyObligationSelector`
**File:** `app/file/components/CompanyObligationSelector.tsx`

**Features:**
- Displays "Check Tax Obligations" button for company PINs
- Fetches obligations from `/api/company/check-obligations` endpoint
- Shows company information (taxpayer name, PIN status)
- Lists all active obligations with checkboxes
- Allows selecting multiple obligations for nil return filing
- Auto-selects all active obligations by default
- Provides "Select All" and "Deselect All" buttons
- Shows count of selected obligations
- Refresh button to re-check obligations

**Props:**
```typescript
interface CompanyObligationSelectorProps {
  pin: string
  onObligationsSelected: (selectedIds: string[]) => void
  selectedObligations: string[]
}
```

### 4. Updated Step2Details Component
**File:** `app/file/components/Step2Details.tsx`

**Changes:**
- Added import for `CompanyObligationSelector`
- Added `selectedObligations` and `setSelectedObligations` props
- Detects company PINs (starting with 'P')
- Conditionally renders `CompanyObligationSelector` for companies
- Maintains existing resident type selector for individuals

### 5. Updated Type Definitions
**File:** `app/file/lib/types.ts`

**Changes:**
- Added `selectedObligations?: string[]` to `Step2Props`
- Added `setSelectedObligations?: (value: string[]) => void` to `Step2Props`

### 6. Updated ReturnSteps Component
**File:** `app/file/components/ReturnSteps.tsx`

**Changes:**
- Added state: `const [selectedObligations, setSelectedObligations] = useState<string[]>([])`
- Added state: `const [residentType, setResidentType] = useState<string>("1")`
- Passes both states to `Step2Details` component

## User Flow

### For Company PINs (Starting with 'P'):

1. **Step 1:** User enters company PIN and password
2. **Step 2:** User sees company details
   - Click "Check Tax Obligations" button
   - System fetches obligations using PIN checker automation
   - User sees list of active obligations with checkboxes
   - User selects which obligations to file nil returns for
   - Can select multiple obligations
3. **Step 3:** Payment (if required)
4. **Step 4:** Filing executes for each selected obligation

### For Individual PINs (Starting with 'A'):

1. **Step 1:** User enters individual PIN and password
2. **Step 2:** User sees individual details
   - Selects resident type (Resident/Non-Resident Individual)
3. **Step 3:** Payment (if required)
4. **Step 4:** Filing executes

## Next Steps (To Complete Implementation)

### Update Filing Logic to Handle Multiple Obligations

The filing logic needs to be updated to:

1. **Loop through selected obligations** for company PINs
2. **File nil return for each selected obligation** sequentially
3. **Track progress** for each obligation
4. **Collect receipts** for all filed obligations
5. **Handle errors** per obligation

**Suggested implementation in `returnHelpers.ts`:**

```typescript
export const fileCompanyNilReturns = async (credentials: {
  pin: string;
  password: string;
  name: string;
  selectedObligations: string[];
}): Promise<FileReturnResponse[]> => {
  const results: FileReturnResponse[] = [];
  
  for (const obligationId of credentials.selectedObligations) {
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: credentials.name,
          kra_pin: credentials.pin,
          kra_password: credentials.password,
          obligation_id: obligationId,
          session_id: sessionService.getData('currentSessionId'),
          return_id: uuidv4()
        })
      });
      
      const data = await response.json();
      results.push(data);
    } catch (error) {
      results.push({
        status: 'error',
        message: error.message,
        obligation_id: obligationId
      });
    }
  }
  
  return results;
};
```

## Testing Checklist

- [ ] Test PIN checker automation with company PIN
- [ ] Verify obligations are fetched correctly
- [ ] Test obligation selection UI (select/deselect)
- [ ] Test filing with single obligation
- [ ] Test filing with multiple obligations
- [ ] Verify receipts are generated for each obligation
- [ ] Test error handling for failed obligations
- [ ] Test with individual PIN (ensure no regression)

## Files Modified

1. ✅ `app/api/company/check-obligations/route.js` (NEW)
2. ✅ `app/api/company/route.js` (MODIFIED)
3. ✅ `app/file/components/CompanyObligationSelector.tsx` (NEW)
4. ✅ `app/file/components/Step2Details.tsx` (MODIFIED)
5. ✅ `app/file/lib/types.ts` (MODIFIED)
6. ✅ `app/file/components/ReturnSteps.tsx` (MODIFIED)
7. ⏳ `app/file/lib/returnHelpers.ts` (PENDING - needs filing logic update)

## Notes

- The obligation IDs are hardcoded based on KRA's system values
- PIN checker automation requires Playwright and Tesseract.js
- Browser automation runs in non-headless mode for CAPTCHA solving
- All database operations use Supabase for tracking and logging
- The system auto-selects all active obligations by default for user convenience
