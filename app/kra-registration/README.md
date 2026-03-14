# KRA PIN Registration Automation

Complete automation for registering a new KRA Personal Identification Number (PIN) with ID OCR extraction using Google Gemini AI.

## Features

- **Multi-step Registration Form** (5 steps)
  1. ID Upload & OCR Extraction
  2. Personal Information Review
  3. Contact & Address Information
  4. Tax Obligations Selection
  5. Review & Submit

- **AI-Powered ID Extraction**
  - Upload National ID (front and back)
  - Automatic extraction using Google Gemini Vision API
  - Extracts: ID number, name, DOB, sex, place of birth, etc.

- **Automated KRA Portal Submission**
  - Playwright automation fills KRA registration forms
  - CAPTCHA solving with Tesseract OCR
  - OTP verification support
  - Automatic PIN retrieval

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 2. Dependencies

Already included in the project:
- `@google/generative-ai` - Gemini AI SDK
- `playwright` - Browser automation
- `tesseract.js` - CAPTCHA OCR

### 3. Usage

Navigate to `/kra-registration` to start the registration process.

## Flow

```
User uploads ID → Gemini extracts info → User reviews/edits → 
User adds contact info → User selects obligations → 
Playwright submits to KRA → PIN returned
```

## API Routes

### `/api/kra/extract-id` (POST)
Extracts information from ID images using Gemini Vision API.

**Request:**
- `FormData` with `frontImage` (required) and `backImage` (optional)

**Response:**
```json
{
  "success": true,
  "extractedData": {
    "idNumber": "887582793",
    "surname": "EPALE",
    "givenName": "JEREMIAH KASILI",
    "dateOfBirth": "15/05/2007",
    "sex": "MALE",
    "placeOfBirth": "TURKANA",
    "nationality": "KEN",
    "dateOfExpiry": "09/02/2036",
    "placeOfIssue": "CENTRAL"
  }
}
```

### `/api/kra/register-pin` (POST)
Automates KRA PIN registration using Playwright.

**Request:**
```json
{
  "idNumber": "887582793",
  "surname": "EPALE",
  "givenName": "JEREMIAH KASILI",
  "dateOfBirth": "15/05/2007",
  "sex": "MALE",
  "placeOfBirth": "TURKANA",
  "profession": "11",
  "citizenship": "KE",
  "streetRoad": "Westlands Road",
  "city": "NAIROBI",
  "county": "30",
  "district": "93",
  "locality": "664",
  "town": "00100",
  "poBox": "3161",
  "mobileNumber": "0740000000",
  "mainEmail": "user@example.com",
  "secondaryEmail": "user2@example.com",
  "incomeTax": true,
  "employmentIncome": "No",
  "businessIncome": "No",
  "rentalIncome": "No"
}
```

**Response:**
```json
{
  "success": true,
  "pin": "A123456789X",
  "message": "KRA PIN registration completed successfully"
}
```

## ID Image Requirements

- **Format:** PNG, JPG, JPEG
- **Size:** Up to 10MB
- **Quality:** Clear, well-lit images
- **Front:** Must show ID number, name, DOB, photo
- **Back (optional):** Shows county, sub-county, location

## Supported ID Types

- Kenyan National ID Card
- Kenyan Passport

## Notes

- OTP verification currently requires manual entry (30-second wait)
- CAPTCHA is automatically solved using Tesseract OCR
- Browser runs in non-headless mode for debugging
- Registration takes approximately 2-3 minutes

## Troubleshooting

**ID extraction fails:**
- Ensure images are clear and well-lit
- Try uploading both front and back
- Check that text is readable

**Registration fails:**
- Verify all required fields are filled
- Check internet connection
- Ensure OTP is entered correctly

**CAPTCHA solving fails:**
- System will retry up to 3 times
- If persistent, check Tesseract configuration
