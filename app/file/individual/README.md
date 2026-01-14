# Individual Tax Returns - ID-Based Authentication

## Overview

This is a clean, simplified implementation for individual tax returns that uses **ID number-based authentication**. No company data or company-related features are included.

## Features

### ✨ ID-Based Workflow
1. **Step 1: ID Number Entry**
   - User enters their 8-digit national ID number
   - System fetches KRA PIN and user details automatically
   - No manual PIN entry required

2. **Step 2: Verify Details**
   - Display fetched user information:
     - Name
     - KRA PIN
     - Email
     - Mobile Number
   - User confirms accuracy before proceeding

3. **Step 3: Password Validation**
   - Validates current KRA iTax password
   - Detects password expiry automatically
   - Handles password reset if expired
   - Multiple validation states:
     - ✅ Valid password
     - 🔄 Password expired (with reset)
     - ❌ Invalid password
     - 🔒 Account locked
     - 🚫 Account cancelled

### 🎨 UI/UX Enhancements

All components use **motion-primitives** for smooth animations:

- **TextRoll**: Animated text reveals character by character
- **FadeIn**: Smooth fade-in with directional slide
- **ScaleIn**: Scale and fade animations for emphasis

### 🔐 Password Validation

The password validation service (`/services/passwordValidation.js`) handles:

- ✅ Login with KRA iTax portal
- ✅ Captcha solving using OCR (Tesseract.js)
- ✅ Password status detection
- ✅ Automatic password reset for expired passwords
- ✅ Safe logout and cleanup

## API Endpoints

### POST `/api/auth/fetch-by-id`

Fetches user details by national ID number.

**Request:**
```json
{
  "idNumber": "12345678"
}
```

**Response:**
```json
{
  "success": true,
  "pin": "A000000000X",
  "idNumber": "12345678",
  "validation": "ok",
  "manufacturerDetails": {
    "basic": {
      "manufacturerName": "JOHN DOE",
      "registrationNumber": "...",
      "pin": "A000000000X"
    },
    "contact": {
      "mainEmail": "john@example.com",
      "mobileNumber": "0712345678"
    }
  }
}
```

### POST `/api/auth/validate-password`

Validates KRA iTax password and handles expiry.

**Request:**
```json
{
  "pin": "A000000000X",
  "password": "currentPassword",
  "newPassword": "newPassword123" // Optional, for reset
}
```

**Response:**
```json
{
  "success": true,
  "status": "valid", // or "password_expired", "invalid", "locked", "cancelled"
  "message": "Login successful, password is valid",
  "requiresPasswordReset": false,
  "newPassword": null
}
```

## File Structure

```
app/file/individual/
├── page.tsx                      # Main individual filing page
├── README.md                     # This file
└── components/
    └── IndividualFileSteps.tsx   # Step components with animations

components/core/
├── text-roll.tsx                 # Animated text reveal
├── fade-in.tsx                   # Fade with directional slide
└── scale-in.tsx                  # Scale animation

services/
└── passwordValidation.js         # Clean password validation service

app/api/auth/
├── fetch-by-id/
│   └── route.ts                  # ID lookup endpoint
└── validate-password/
    └── route.ts                  # Password validation endpoint
```

## Usage

### Navigate to Individual Filing

```
/file/individual
```

### Step-by-Step Process

1. **Enter ID Number**: User inputs 8-digit national ID
2. **Auto-fetch Details**: System retrieves PIN and user info from KRA
3. **Verify Information**: User confirms details are correct
4. **Password Validation**: User enters password, system validates
5. **Handle Expiry**: If expired, user sets new password automatically
6. **Proceed to Payment**: After validation, continue to payment/filing

## Password Reset Flow

When a password is expired:

1. System detects expiry during validation
2. UI updates to show password reset form
3. User enters:
   - Current password
   - New password
   - Confirm new password
4. System automatically resets password via KRA iTax
5. User proceeds with new password

## Dependencies

- `playwright` - Browser automation for KRA login
- `tesseract.js` - OCR for captcha solving
- `motion` (framer-motion) - Animations
- `@supabase/supabase-js` - Database (if needed)

## Security

- ✅ No credentials stored in frontend
- ✅ Password validation happens server-side
- ✅ Secure password reset flow
- ✅ Automatic cleanup of temporary files
- ✅ Safe browser session management

## Error Handling

The system handles various error states:

- **Invalid ID**: ID not found in KRA system
- **Invalid Password**: Incorrect password entered
- **Password Expired**: Automatic reset flow triggered
- **Account Locked**: User notified to contact KRA
- **Account Cancelled**: User notified to contact KRA
- **Network Errors**: Retry logic with user feedback

## Notes

- This implementation does **NOT** include company/business features
- Focused solely on individual taxpayers
- Uses official KRA iTax portal for validation
- Clean, modern UI with smooth animations
- Mobile-responsive design
