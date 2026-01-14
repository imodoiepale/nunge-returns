# Implementation Guide - ID-Based Individual Returns

## Quick Start

### 1. Install Dependencies

Ensure you have the required packages:

```bash
npm install playwright tesseract.js motion @supabase/supabase-js
```

### 2. Setup Playwright

Install browser binaries:

```bash
npx playwright install chromium
```

Or specify Chrome path in `passwordValidation.js` (already configured for Windows).

### 3. Environment Variables

Create `.env.local` if needed:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. Access the Individual Filing Page

Navigate to:
```
http://localhost:3000/file/individual
```

## How It Works

### Flow Diagram

```
User enters ID → Fetch from KRA → Display details → Verify → Password check → Continue
     (8 digits)      (API call)     (with PIN)    (confirm)    (validate)    (payment)
```

### Step 1: ID Number Entry

**Component**: `Step1ID`

- User inputs 8-digit national ID
- Validates length before allowing submission
- Calls `/api/auth/fetch-by-id` endpoint
- Shows loading state during fetch

### Step 2: Details Verification

**Component**: `Step2Verify`

- Displays fetched information:
  - Name from KRA records
  - Automatically fetched PIN
  - Email address
  - Mobile number
- User confirms or goes back to re-enter ID

### Step 3: Password Validation

**Component**: `Step3Password`

- User enters KRA iTax password
- System validates via `/api/auth/validate-password`
- Handles multiple scenarios:
  - ✅ Valid: Proceed to next step
  - 🔄 Expired: Show password reset fields
  - ❌ Invalid: Show error, allow retry
  - 🔒 Locked: Show contact KRA message
  - 🚫 Cancelled: Show contact KRA message

## Technical Details

### Password Validation Process

The `passwordValidation.js` service:

1. **Launches Browser**: Uses Playwright to control Chrome
2. **Navigates to KRA**: Opens iTax portal login page
3. **Fills Credentials**: Enters PIN and password
4. **Solves Captcha**: Uses Tesseract OCR to read and solve arithmetic captcha
5. **Submits Login**: Clicks login button
6. **Checks Status**: Analyzes response for success/error messages
7. **Handles Reset**: If expired, automatically resets password
8. **Logs Out**: Safely closes session
9. **Returns Result**: Sends status back to API

### Captcha Handling

The system handles arithmetic captchas like "5 + 3 = ?" automatically:

1. Takes screenshot of captcha image
2. Extracts text using Tesseract OCR
3. Parses numbers and operator
4. Calculates result
5. Submits answer
6. Retries up to 5 times if wrong

### Error States

| Status | Description | User Action |
|--------|-------------|-------------|
| `valid` | Password correct | Continue to payment |
| `password_expired` | Password expired | Reset password |
| `invalid` | Wrong password | Re-enter password |
| `locked` | Account locked | Contact KRA |
| `cancelled` | Account cancelled | Contact KRA |
| `details_not_updated` | iTax details outdated | Update on iTax |
| `error` | System error | Retry or contact support |

## Motion Primitives Usage

### TextRoll Component

Animated character-by-character text reveal:

```tsx
<TextRoll className="text-4xl font-bold">
  Individual Returns
</TextRoll>
```

### FadeIn Component

Fade in with directional slide:

```tsx
<FadeIn delay={0.3} direction="up">
  <Card>...</Card>
</FadeIn>
```

### ScaleIn Component

Scale and fade animation:

```tsx
<ScaleIn delay={0.2}>
  <Icon className="w-16 h-16" />
</ScaleIn>
```

## Customization

### Change Password Reset Default

In `passwordValidation.js`, modify the new password:

```javascript
// Default password for resets
const DEFAULT_NEW_PASSWORD = "YourCustomPassword123";
```

### Adjust Animation Timing

In component files, modify delay values:

```tsx
<FadeIn delay={0.5}> {/* Increase for slower reveal */}
```

### Modify Captcha Retry Count

In `passwordValidation.js`:

```javascript
const maxAttempts = 5; // Change this value
```

## Testing

### Test ID Numbers

Use valid Kenyan ID numbers for testing. The system will:

1. Query KRA for PIN
2. Fetch associated details
3. Return data if found

### Test Password Validation

Ensure you have:
- Valid KRA PIN
- Correct iTax password
- Chrome installed

### Mock Mode (Development)

To test without actually hitting KRA:

1. Create mock API responses
2. Add environment flag
3. Return test data

```typescript
if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
  return mockResponse;
}
```

## Troubleshooting

### Issue: "Captcha extraction failed"

**Solution**: 
- Check Chrome installation path
- Ensure Tesseract.js is installed
- Try running in non-headless mode to see captcha

### Issue: "Failed to fetch details"

**Solution**:
- Verify ID number is correct
- Check internet connection
- Ensure KRA portal is accessible

### Issue: "Browser launch failed"

**Solution**:
- Install Playwright browsers: `npx playwright install`
- Check Chrome path in `passwordValidation.js`
- Verify system has required dependencies

### Issue: Animations not working

**Solution**:
- Check `motion` package is installed
- Verify import paths are correct
- Ensure components are client-side (`"use client"`)

## Production Considerations

### 1. Rate Limiting

Add rate limiting to API endpoints:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Implement rate limiting logic
}
```

### 2. Caching

Cache fetched user details temporarily:

```typescript
// Use Redis or in-memory cache
const cached = await redis.get(`user:${idNumber}`);
```

### 3. Logging

Add comprehensive logging:

```typescript
console.log(`[${timestamp}] User ${idNumber} - ${action}`);
```

### 4. Error Tracking

Integrate error tracking (e.g., Sentry):

```typescript
Sentry.captureException(error);
```

### 5. Security Headers

Add security headers in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        // ... more headers
      ],
    },
  ];
}
```

## Next Steps

After password validation:

1. **Payment Processing**: Integrate M-Pesa or other payment methods
2. **Return Filing**: Automate nil return filing
3. **Receipt Generation**: Generate and send receipts
4. **Email Notifications**: Send confirmation emails
5. **SMS Alerts**: Send status updates via SMS

## Support

For issues or questions:
- Check the README files
- Review error logs
- Test with known valid credentials
- Verify all dependencies are installed
