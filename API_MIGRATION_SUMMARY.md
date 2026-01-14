# API Migration Summary - Fixed 500 Error

## Issue
- **Error**: API request failed with status 500
- **Location**: `/api/auth/fetch-by-id` route
- **Cause**: Missing proper error handling, timeout management, and reverse proxy pattern

## Solution

### New API Route: `/api/kra/fetch-by-id`

Created a clean, production-ready Next.js API route with proper reverse proxy pattern.

**Location**: `app/api/kra/fetch-by-id/route.ts`

### Key Improvements

#### 1. **Comprehensive Error Handling**
```typescript
✅ Try-catch blocks at every level
✅ Detailed error logging with timestamps
✅ Proper error messages returned to client
✅ Development vs production error details
```

#### 2. **Timeout Management**
```typescript
✅ 30-second timeout on all HTTPS requests
✅ Timeout error handling
✅ Request cleanup on timeout
```

#### 3. **Better Logging**
```typescript
✅ Request start/end timestamps
✅ Duration tracking
✅ Step-by-step progress logging
✅ Error stack traces in development
```

#### 4. **Input Validation**
```typescript
✅ Check for missing ID number
✅ Validate 8-digit format
✅ Proper error responses (400, 404, 500)
```

#### 5. **Reverse Proxy Pattern**
```typescript
✅ Server-side HTTPS requests to KRA
✅ Cookie management
✅ Session initialization
✅ DWR protocol handling
```

## Changes Made

### 1. New API Route
**File**: `app/api/kra/fetch-by-id/route.ts`

**Features**:
- `initKraSession()` - Initialize KRA iTax session with cookies
- `callKraDWR()` - Call KRA DWR endpoints with retry logic
- `parseDWRResponse()` - Parse DWR callback format
- `fetchManufacturerDetails()` - Fetch complete user details
- `findPinByIdNumber()` - Main orchestration function
- `POST()` - API route handler

**Flow**:
```
1. Initialize KRA session → Get cookies
2. Generate session IDs (scriptSessionId, windowName)
3. Call DWR to get masked PIN
4. Decode PIN from masked response
5. Validate PIN with KRA
6. Fetch manufacturer details (name, email, address, etc.)
7. Return formatted response
```

### 2. Updated Frontend
**File**: `app/file/individual/page.tsx`

**Changes**:
- Updated endpoint: `/api/auth/fetch-by-id` → `/api/kra/fetch-by-id`
- Added console logging for debugging
- Enhanced error messages
- Better error handling with specific checks

### 3. Full Name Support
**Already implemented** in previous update:
- Extracts `firstName`, `middleName`, `lastName` from KRA
- Builds complete `fullName` field
- Falls back to `manufacturerName` if needed

### 4. Complete Manufacturer Details
**Already implemented**:
- Personal info (full name, PIN, ID number)
- Contact info (email, mobile, telephone)
- Address info (county, town, descriptive address)
- Business info (if applicable)

## API Endpoints

### Before (OLD - Don't use)
```
POST /api/auth/fetch-by-id
```

### After (NEW - Use this)
```
POST /api/kra/fetch-by-id
```

**Request**:
```json
{
  "idNumber": "12345678"
}
```

**Response** (Success):
```json
{
  "success": true,
  "pin": "A000000000X",
  "idNumber": "12345678",
  "validation": "ok",
  "manufacturerDetails": {
    "basic": {
      "fullName": "JOHN KAMAU DOE",
      "firstName": "JOHN",
      "middleName": "KAMAU",
      "lastName": "DOE",
      "pin": "A000000000X",
      "idNumber": "12345678"
    },
    "contact": {
      "mainEmail": "john@example.com",
      "mobileNumber": "0712345678"
    },
    "address": {
      "county": "NAIROBI",
      "town": "NAIROBI"
    }
  }
}
```

**Response** (Error):
```json
{
  "error": "Failed to fetch details from KRA",
  "message": "Detailed error message",
  "details": "Stack trace (development only)"
}
```

## Testing Checklist

- [ ] Enter valid 8-digit ID number
- [ ] Check browser console for logs
- [ ] Verify API responds within 30 seconds
- [ ] Check that full name is displayed (not just first name)
- [ ] Verify manufacturer details are populated
- [ ] Test with invalid ID number (should show error)
- [ ] Test with missing ID number (should show validation error)

## Error Messages

| Status | Message | Cause |
|--------|---------|-------|
| 400 | ID number is required | Missing idNumber in request |
| 400 | ID number must be 8 digits | Invalid format (not 8 digits) |
| 500 | Failed to fetch details from KRA | Network error, timeout, or KRA issue |
| 500 | No response from KRA PIN lookup | Empty DWR response |
| 500 | Invalid response format from KRA | Malformed response |

## Debugging

### Browser Console
```javascript
[UI] Fetching details for ID: 12345678
[UI] API response: { status: 200, success: true }
[UI] User details extracted: { pin: "A000000000X", name: "JOHN KAMAU DOE" }
```

### Server Console
```javascript
[KRA API] Starting PIN lookup for ID: 12345678
[KRA API] Initializing session...
[KRA API] Session initialized, cookies: [ 'JSESSIONID', ... ]
[KRA API] Calling DWR: findPinByIdno.findPinByIdnumber
[KRA API] DWR response received (234 bytes)
[KRA API] Masked response: A00000*****#$43210
[KRA API] PIN decoded successfully
[KRA API] Fetching manufacturer details for PIN: A000000000X
[KRA API] Manufacturer details fetched successfully
[API] Request completed successfully in 3542ms
```

## Rollback Plan

If new API has issues, temporarily update frontend to use old endpoint:

```typescript
// In app/file/individual/page.tsx
const response = await fetch("/api/auth/fetch-by-id", { // old endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idNumber })
})
```

## Next Steps

1. **Test the new API** with real ID numbers
2. **Monitor server logs** for any errors
3. **Remove old API route** once confirmed working: `app/api/auth/fetch-by-id/route.ts`
4. **Update password validation** to use the same error handling pattern

## Performance

**Expected timings**:
- Session init: ~500-1000ms
- PIN lookup: ~1000-2000ms
- Details fetch: ~1000-2000ms
- **Total**: ~3-5 seconds

**Timeout**: 30 seconds per request (configurable)

## Security

✅ All KRA requests go through server-side proxy
✅ No credentials exposed to client
✅ Cookie management handled server-side
✅ Input validation on ID number format
✅ Error details hidden in production
