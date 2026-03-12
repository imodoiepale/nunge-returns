# DETAILED SERVICE FLOWS - NUNGE RETURNS

## TABLE OF CONTENTS
1. [KRA PIN Registration](#1-kra-pin-registration)
2. [KRA Password Recovery/Reset](#2-kra-password-recoveryreset)
3. [KRA Email Change](#3-kra-email-change)
4. [File Nil Returns](#4-file-nil-returns)
5. [NSSF Registration](#5-nssf-registration)
6. [SHIF Registration](#6-shif-registration)

---

## 1. KRA PIN REGISTRATION

### Service Overview
- **Price:** KES 50
- **Processing Time:** 5 minutes (Standard) / 1 minute (Express)
- **Target Audience:** Kenyan residents, students, first-time taxpayers

### Official KRA Process (Traditional Method)
1. Visit KRA iTax portal or physical office
2. Fill out lengthy registration forms
3. Upload multiple documents
4. Wait for verification (3-7 days)
5. Receive PIN via email/SMS

### Nunge Returns Streamlined Process

#### Step 1: User Initiates Service
- User navigates to `/services/register-kra-pin`
- Reviews service details and requirements
- Clicks "Register KRA PIN Now"

#### Step 2: Checkout & Payment
- User redirected to `/checkout/register-kra-pin`
- Form fields:
  - Full Name
  - Email Address
  - Phone Number (M-Pesa)
  - Payment Method (M-Pesa/Card)
- User submits payment (KES 50)
- M-Pesa STK push initiated

#### Step 3: Document Collection
- User receives email with secure upload link
- Required documents:
  - National ID (front & back) OR Passport
  - Passport-size photo (optional but recommended)
- Documents uploaded via secure portal

#### Step 4: Backend Processing
- System validates documents using OCR
- Extracts ID number, names, DOB automatically
- Submits application to KRA iTax API
- Monitors application status

#### Step 5: Completion & Delivery
- User receives KRA PIN via email
- SMS notification sent to phone
- Digital receipt with PIN details
- Access to download PIN certificate

### Required Information
- **Personal Details:**
  - Full Name (as per ID)
  - National ID Number / Passport Number
  - Date of Birth
  - Phone Number
  - Email Address
  
- **Documents:**
  - National ID (Kenyan residents)
  - Passport (Non-residents)
  - Digital passport photo

### Email Templates

#### Email 1: Payment Confirmation
**Subject:** Payment Received - KRA PIN Registration

```
Dear [Customer Name],

Thank you for choosing Nunge Returns!

We've received your payment of KES 50 for KRA PIN Registration.

Next Steps:
1. Upload your National ID/Passport
2. We'll process your application
3. Receive your PIN within 5 minutes

Upload your documents here: [Secure Link]

Transaction ID: [XXXXX]

Need help? Reply to this email or WhatsApp us at +254 XXX XXX XXX

Best regards,
Nunge Returns Team
```

#### Email 2: Document Upload Reminder
**Subject:** Action Required - Upload Documents for KRA PIN

```
Hi [Customer Name],

We're ready to process your KRA PIN registration!

Please upload the following documents:
✓ National ID (front and back) OR Passport
✓ Recent passport photo (optional)

Upload here: [Secure Link]

This link expires in 24 hours.

Questions? We're here to help!

Nunge Returns Team
```

#### Email 3: PIN Delivery
**Subject:** 🎉 Your KRA PIN is Ready!

```
Congratulations [Customer Name]!

Your KRA PIN: [A123456789X]

What's Next?
- Save this PIN securely
- Use it for tax filing, business registration, and more
- Download your PIN certificate: [Link]

Important: Keep this PIN confidential.

Need to file nil returns? Get it done in 30 seconds: [Link]

Thank you for trusting Nunge Returns!

Best regards,
The Nunge Returns Team
```

---

## 2. KRA PASSWORD RECOVERY/RESET

### Service Overview
- **Price:** KES 50
- **Processing Time:** 5 minutes (Standard) / 1 minute (Express)
- **Target Audience:** Taxpayers locked out of iTax accounts

### Official KRA Process (Traditional Method)
1. Visit iTax login page
2. Click "Forgot Password"
3. Answer security questions (often forgotten)
4. Wait for email (may take hours/days)
5. If failed, visit KRA office physically
6. Submit ID and PIN for manual reset
7. Wait 3-5 business days

### Nunge Returns Streamlined Process

#### Step 1: Service Selection
- User navigates to `/services/renew-kra-password`
- Reviews service benefits
- Clicks "Reset KRA Password Now"

#### Step 2: Checkout & Payment
- User redirected to `/checkout/renew-kra-password`
- Provides:
  - Full Name
  - KRA PIN
  - National ID Number
  - Registered Phone Number
  - Email Address
- Completes payment (KES 50)

#### Step 3: Identity Verification
- User receives OTP to registered phone
- Uploads National ID for verification
- System cross-references with KRA database

#### Step 4: Password Reset Processing
- Backend system accesses KRA iTax portal
- Initiates password reset via API/automation
- Generates secure temporary password
- Updates user credentials

#### Step 5: Delivery & Confirmation
- User receives email with password reset instructions
- SMS with temporary password
- Instructions to change password on first login
- Confirmation of successful reset

### Required Information
- **User Details:**
  - KRA PIN
  - National ID Number
  - Full Name (as registered)
  - Registered Phone Number
  - Current Email Address

- **Verification:**
  - National ID/Passport copy
  - OTP verification

### Email Templates

#### Email 1: Payment Confirmation
**Subject:** Password Reset Request Received

```
Hi [Customer Name],

We've received your KRA password reset request.

Service: KRA Password Reset
Amount Paid: KES 50
Transaction ID: [XXXXX]

Next Steps:
1. Verify your identity (check your phone for OTP)
2. We'll reset your password
3. Receive new login credentials within 5 minutes

Processing your request now...

Nunge Returns Team
```

#### Email 2: OTP Verification
**Subject:** Verify Your Identity - OTP Required

```
Dear [Customer Name],

To complete your password reset, please verify your identity.

Your OTP: [123456]

Enter this code in the verification portal: [Link]

This code expires in 10 minutes.

Didn't request this? Contact us immediately.

Nunge Returns Team
```

#### Email 3: Password Reset Complete
**Subject:** ✅ Your KRA Password Has Been Reset

```
Great news, [Customer Name]!

Your KRA iTax password has been successfully reset.

Temporary Password: [TempPass123!]

IMPORTANT:
1. Login to iTax: https://itax.kra.go.ke
2. Use your KRA PIN: [AXXXXXXXXX]
3. Enter the temporary password above
4. You'll be prompted to create a new password
5. Choose a strong, unique password

Security Tips:
- Don't share your password
- Use a mix of letters, numbers, and symbols
- Change it regularly

Need help logging in? We're here: support@nungereturns.com

Best regards,
Nunge Returns Team
```

#### Email 4: Forgot PIN Recovery (Alternative Service)
**Subject:** Can't Remember Your KRA PIN?

```
Hi [Customer Name],

We noticed you're having trouble with your KRA account.

If you've forgotten your PIN (not just password), we can help with that too!

KRA PIN Recovery Service - KES 50
→ Retrieve your PIN in minutes
→ No office visits required

Get Started: [Link]

Already have your PIN? Ignore this message.

Nunge Returns Team
```

---

## 3. KRA EMAIL CHANGE

### Service Overview
- **Price:** KES 50
- **Processing Time:** 30 minutes
- **Target Audience:** Taxpayers needing to update contact information

### Official KRA Process (Traditional Method)
1. Login to iTax portal
2. Navigate to profile settings
3. Request email change
4. Verify old email (problem if no access)
5. Submit request
6. Wait for KRA approval (1-3 weeks)
7. If old email inaccessible, visit KRA office with ID

### Nunge Returns Streamlined Process

#### Step 1: Service Initiation
- User visits `/services/change-kra-email`
- Reviews requirements
- Clicks "Update KRA Email Now"

#### Step 2: Checkout & Information Collection
- User provides:
  - KRA PIN
  - National ID Number
  - Old Email Address (if accessible)
  - New Email Address
  - Phone Number
- Payment: KES 50

#### Step 3: Verification Process
- If old email accessible:
  - Verification code sent to old email
  - Confirmation code sent to new email
- If old email NOT accessible:
  - Alternative verification via ID + phone OTP
  - Additional security questions

#### Step 4: Backend Processing
- System logs into KRA iTax portal
- Navigates to profile settings
- Updates email address
- Confirms change with KRA

#### Step 5: Confirmation
- User receives confirmation at new email
- SMS notification sent
- Digital receipt of service
- Instructions for future logins

### Required Information
- **Account Details:**
  - KRA PIN
  - National ID Number
  - Current registered email (if accessible)
  - New email address
  - Phone number

- **Verification:**
  - Access to old email (preferred) OR
  - National ID copy + phone OTP

### Email Templates

#### Email 1: Service Confirmation (to old email if accessible)
**Subject:** KRA Email Change Request - Verification Required

```
Dear [Customer Name],

We've received a request to change your KRA registered email.

Current Email: [old@email.com]
New Email: [new@email.com]
KRA PIN: [AXXXXXXXXX]

To confirm this change, click here: [Verification Link]

Didn't request this? Contact us immediately: +254 XXX XXX XXX

This link expires in 1 hour.

Nunge Returns Team
```

#### Email 2: Welcome to New Email
**Subject:** Verify Your New KRA Email Address

```
Hi [Customer Name],

You're almost done! Please verify your new email address.

Verification Code: [ABC123]

Enter this code here: [Link]

Once verified, this will be your official KRA contact email.

Nunge Returns Team
```

#### Email 3: Change Complete (to new email)
**Subject:** ✅ KRA Email Successfully Updated

```
Congratulations [Customer Name]!

Your KRA email has been successfully changed.

Old Email: [old@email.com]
New Email: [new@email.com]
KRA PIN: [AXXXXXXXXX]

What This Means:
✓ All KRA notifications will come to this email
✓ Use this email for iTax login
✓ Tax receipts will be sent here

Important: Update your password for added security
Reset Password: [Link to password reset service]

Questions? We're here to help!

Best regards,
Nunge Returns Team
```

---

## 4. FILE NIL RETURNS

### Service Overview
- **Price:** KES 50
- **Processing Time:** 30 seconds
- **Target Audience:** Individuals and companies with no taxable income

### Official KRA Process (Traditional Method)
1. Login to iTax portal (https://itax.kra.go.ke)
2. Navigate to Returns > File Returns
3. Select return type (Individual/Company)
4. Choose tax period
5. Fill out forms (even for nil)
6. Declare zero income
7. Submit return
8. Download acknowledgment receipt
9. Process takes 15-30 minutes for first-timers

### Nunge Returns Streamlined Process

#### Step 1: Service Selection
- User visits `/services/file-nil-returns`
- Sees "30-second filing" promise
- Clicks "File Nil Returns Now"

#### Step 2: Quick Checkout
- User provides:
  - KRA PIN
  - iTax Password
  - Return Type (Individual/Company)
  - Tax Period (month/year)
  - Email for receipt
  - Phone number
- Payment: KES 50

#### Step 3: Automated Filing
- System logs into iTax using credentials
- Navigates to returns section
- Selects appropriate return type
- Fills nil return forms automatically
- Submits return to KRA
- Captures acknowledgment receipt

#### Step 4: Confirmation & Receipt
- User receives email with:
  - KRA acknowledgment receipt (PDF)
  - Filing confirmation
  - Transaction details
- SMS confirmation sent
- Receipt stored in user account

### Required Information
- **Login Credentials:**
  - KRA PIN
  - iTax Password
  
- **Filing Details:**
  - Return Type (Individual IT1 / Company IT2)
  - Tax Period (Month & Year)
  - Email address
  - Phone number

### Email Templates

#### Email 1: Filing in Progress
**Subject:** Filing Your Nil Returns Now...

```
Hi [Customer Name],

We're filing your nil returns right now!

Details:
- KRA PIN: [AXXXXXXXXX]
- Return Type: [Individual/Company]
- Period: [January 2024]

This will take about 30 seconds...

Nunge Returns Team
```

#### Email 2: Filing Complete
**Subject:** ✅ Nil Returns Filed Successfully!

```
Great news, [Customer Name]!

Your nil returns have been successfully filed with KRA.

Filing Details:
- KRA PIN: [AXXXXXXXXX]
- Return Type: [Individual Income Tax]
- Period: [January 2024]
- Filing Date: [12/03/2026]
- Acknowledgment No: [ACK123456789]

Download Your Receipt: [PDF Link]

What's Next?
- Keep this receipt for your records
- You're now compliant for this period
- Need to file for another period? [Link]

Thank you for using Nunge Returns!

Best regards,
Nunge Returns Team
```

#### Email 3: Reminder for Next Period
**Subject:** 📅 Time to File Next Month's Returns

```
Hi [Customer Name],

Just a friendly reminder!

Your next nil returns filing is due soon for [February 2024].

File in 30 seconds: [Link]
Price: KES 50

Stay compliant, avoid penalties!

Nunge Returns Team

P.S. Want automatic monthly filing? Ask about our subscription plans!
```

---

## 5. NSSF REGISTRATION

### Service Overview
- **Price:** KES 50
- **Processing Time:** 24 hours
- **Target Audience:** Employed and self-employed Kenyans

### Official NSSF Process (Traditional Method)
1. Visit NSSF office or website
2. Download registration forms
3. Fill out lengthy paperwork
4. Attach KRA PIN certificate
5. Attach ID copies
6. Submit to NSSF office
7. Wait 5-10 business days
8. Receive membership number via post/email

### Nunge Returns Streamlined Process

#### Step 1: Service Access
- User visits `/services/register-nssf`
- Reviews NSSF benefits
- Clicks "Register for NSSF Now"

#### Step 2: Information Collection
- User provides:
  - Full Name
  - National ID Number
  - KRA PIN
  - Phone Number
  - Email Address
  - Employment Status (Employed/Self-employed)
  - Employer PIN (if employed)
- Payment: KES 50

#### Step 3: Document Upload
- National ID (front & back)
- KRA PIN certificate
- Passport photo

#### Step 4: Backend Processing
- System validates all information
- Submits application to NSSF portal
- Monitors application status
- Retrieves membership number

#### Step 5: Delivery
- User receives NSSF membership number
- Digital certificate sent via email
- SMS confirmation
- Instructions for contributions

### Required Information
- **Personal Details:**
  - Full Name
  - National ID Number
  - KRA PIN
  - Date of Birth
  - Phone Number
  - Email Address
  
- **Employment Info:**
  - Employment Status
  - Employer Name (if employed)
  - Employer PIN (if employed)
  
- **Documents:**
  - National ID copy
  - KRA PIN certificate
  - Passport photo

### Email Templates

#### Email 1: Application Submitted
**Subject:** NSSF Registration in Progress

```
Dear [Customer Name],

Your NSSF registration application has been submitted!

Application Details:
- Name: [Full Name]
- ID Number: [12345678]
- KRA PIN: [AXXXXXXXXX]

Processing Time: Within 24 hours

We'll notify you once your membership number is ready.

Nunge Returns Team
```

#### Email 2: Membership Approved
**Subject:** 🎉 Your NSSF Membership is Active!

```
Congratulations [Customer Name]!

Your NSSF membership has been approved.

NSSF Membership Number: [NSSF123456789]

What's Next?
1. Save your membership number
2. Inform your employer (if employed)
3. Start making contributions
4. Track your savings on NSSF portal

Access NSSF Portal: https://www.nssfkenya.co.ke

Download Your Certificate: [Link]

Securing your future, one step at a time!

Best regards,
Nunge Returns Team
```

---

## 6. SHIF REGISTRATION

### Service Overview
- **Price:** KES 50
- **Processing Time:** 48 hours
- **Target Audience:** All Kenyans seeking health insurance coverage

### Official SHIF Process (Traditional Method)
1. Visit SHA/SHIF office or portal
2. Fill registration forms
3. Provide KRA PIN and ID details
4. Upload passport photo
5. Submit application
6. Wait for verification (5-7 days)
7. Receive SHIF number
8. Activate account with first contribution

### Nunge Returns Streamlined Process

#### Step 1: Service Selection
- User visits `/services/register-shif`
- Reviews health coverage benefits
- Clicks "Register for SHIF Now"

#### Step 2: Data Collection
- User provides:
  - Full Name
  - National ID Number
  - KRA PIN
  - Phone Number
  - Email Address
  - County of Residence
  - Dependents info (optional)
- Payment: KES 50

#### Step 3: Document Upload
- National ID (both sides)
- KRA PIN certificate
- Recent passport photo
- Dependents' IDs (if applicable)

#### Step 4: Processing
- System validates information
- Submits to SHIF portal
- Monitors registration status
- Retrieves SHIF number

#### Step 5: Activation & Delivery
- User receives SHIF number
- Digital membership card
- Coverage details
- Contribution instructions

### Required Information
- **Personal Details:**
  - Full Name
  - National ID Number
  - KRA PIN
  - Date of Birth
  - Phone Number
  - Email Address
  - County of Residence
  
- **Dependents (Optional):**
  - Spouse details
  - Children details
  
- **Documents:**
  - National ID
  - KRA PIN certificate
  - Passport photo
  - Marriage certificate (for spouse)
  - Birth certificates (for children)

### Email Templates

#### Email 1: Registration Initiated
**Subject:** SHIF Registration Started

```
Hi [Customer Name],

Your SHIF registration is underway!

Details:
- Name: [Full Name]
- ID: [12345678]
- KRA PIN: [AXXXXXXXXX]
- Dependents: [2 - Spouse & 1 Child]

Processing Time: 48 hours

We'll keep you updated!

Nunge Returns Team
```

#### Email 2: Registration Complete
**Subject:** ✅ Welcome to SHIF - Your Health Coverage is Active!

```
Congratulations [Customer Name]!

Your SHIF registration is complete!

SHIF Number: [SHIF987654321]

Coverage Details:
- Principal Member: [Your Name]
- Dependents: [Spouse, 1 Child]
- Coverage Start: [48 hours from first contribution]

What's Next?
1. Make your first contribution
2. Coverage activates within 48 hours
3. Access healthcare at SHIF-accredited facilities

Download Your SHIF Card: [Link]
Find Accredited Facilities: [Link]

Your health, our priority!

Best regards,
Nunge Returns Team
```

---

## GENERAL PROCESS NOTES

### Payment Processing
- All services use M-Pesa STK Push
- Instant payment confirmation
- Secure transaction handling
- Automatic receipt generation

### Security Measures
- Bank-level encryption (SSL/TLS)
- Secure document upload
- No storage of passwords
- OTP verification for sensitive operations
- Compliance with data protection laws

### Customer Support
- 24/7 email support
- WhatsApp support during business hours
- Average response time: 15 minutes
- Dedicated support for stuck applications

### Success Metrics
- 95%+ success rate on first attempt
- Average processing time: 5 minutes
- Customer satisfaction: 4.8/5 stars
- 10,000+ successful transactions

---

*Last Updated: March 2026*
*Nunge Returns - Simplifying Tax Compliance for Kenyan Youth*
