// lib/whatsapp/message-templates.ts
// Pre-built message templates for WhatsApp conversations

export const GREETING = (name?: string) =>
  `Hi${name ? ` ${name}` : ''}! 👋 Welcome to *Nunge Returns* — Kenya's fastest KRA tax filing service.

How can I help you today? Choose a service below or just type your request.`;

export const SERVICE_MENU_SECTIONS = [
  {
    title: 'Tax Filing',
    rows: [
      { title: 'File Nil Returns (Individual)', description: 'KES 50 — File your personal nil tax return', rowId: 'nil_returns_individual' },
      { title: 'File Nil Returns (Company)', description: 'KES 50 per obligation — File company nil returns', rowId: 'nil_returns_company' },
    ],
  },
  {
    title: 'Account Management',
    rows: [
      { title: 'Reset KRA Password', description: 'Reset your iTax password via email', rowId: 'password_reset' },
      { title: 'Terminate Obligation', description: 'Deregister a company tax obligation', rowId: 'terminate_obligation' },
    ],
  },
  {
    title: 'Other Services',
    rows: [
      { title: 'NSSF Registration', description: 'Get help with NSSF registration', rowId: 'nssf' },
      { title: 'SHIF Registration', description: 'Get help with SHIF registration', rowId: 'shif' },
      { title: 'Check Status', description: 'Check status of a previous request', rowId: 'status_check' },
      { title: 'Get Support', description: 'Talk to our support team', rowId: 'support' },
    ],
  },
];

export const ASK_PIN = `Please provide your *KRA PIN*.

Format: A or P followed by 9 digits and a letter
Example: *A001234567B* (individual) or *P051234567C* (company)`;

export const ASK_PASSWORD = `Now I need your *KRA iTax password*.

🔒 Your password is only used to file your return and is not stored.`;

export const INVALID_PIN = `❌ That doesn't look like a valid KRA PIN.

A valid PIN:
• Starts with *A* (individual) or *P* (company)
• Has *9 digits* in the middle
• Ends with a *letter*

Example: *A001234567B*

Please try again.`;

export const PIN_VERIFIED = (name: string, pin: string) =>
  `✅ *PIN Verified!*

Taxpayer: ${name}
PIN: ${pin}

Now I'll need your KRA iTax password to proceed.`;

export const PASSWORD_INVALID = `❌ The password is incorrect.

Would you like to:
1. *Try again* — Re-enter your password
2. *Reset password* — Send a reset link to your email
3. *Cancel* — Go back to the main menu`;

export const ASK_OBLIGATIONS = (obligations: { id: string; name: string }[]) => {
  const list = obligations.map((o, i) => `${i + 1}. ${o.name}`).join('\n');
  return `Your company has the following tax obligations:

${list}

Reply with the *numbers* of the obligations you want to file (comma-separated), or type *all* to file for all obligations.

Example: *1, 3* or *all*`;
};

export const PAYMENT_REQUEST = (amount: number, serviceCount: number) =>
  `💰 *Payment Required*

Services: ${serviceCount}
Amount: *KES ${amount}*

Please provide your *M-Pesa phone number* to receive the payment request.

Or send *KES ${amount}* to our M-Pesa Till and share the confirmation code.`;

export const PAYMENT_STK_SENT = (phone: string, amount: number) =>
  `📱 M-Pesa payment request sent to *${phone}*.

Amount: *KES ${amount}*

Please enter your M-Pesa PIN on your phone to complete the payment. I'll confirm once it's received.`;

export const PAYMENT_CONFIRMED = (reference: string) =>
  `✅ *Payment Confirmed!*

Reference: ${reference}

Processing your request now...`;

export const FILING_IN_PROGRESS = `⏳ *Filing in progress...*

I'm filing your nil return(s) on the KRA iTax portal now. This usually takes 1-3 minutes.

I'll send you the receipt as soon as it's done.`;

export const FILING_SUCCESS = (receiptUrl: string, pin: string) =>
  `🎉 *Filing Complete!*

PIN: ${pin}
Status: ✅ Successfully filed

Your acknowledgement receipt is attached above. You can also download it here:
${receiptUrl}`;

export const FILING_BATCH_SUCCESS = (results: { name: string; status: string }[]) => {
  const lines = results.map(r => `${r.status === 'completed' ? '✅' : '❌'} ${r.name}: ${r.status}`).join('\n');
  return `📋 *Batch Filing Results*

${lines}

Receipts for successful filings are attached above.`;
};

export const FILING_FAILED = (error: string) =>
  `❌ *Filing Failed*

Error: ${error}

This usually happens when:
• The password is incorrect
• The account is locked
• There's employment income (can't file nil)
• KRA portal is temporarily down

Would you like to:
1. *Try again*
2. *Get support*
3. *Main menu*`;

export const TERMINATION_ASK_REASON = `Please select a reason for termination:

1. Business Closed
2. Business Dormant
3. Merged with Another Entity
4. Obligation Not Applicable
5. Duplicate Registration

Reply with the *number* of your reason.`;

export const TERMINATION_SUBMITTED = (obligationName: string) =>
  `✅ *Termination Request Submitted*

Obligation: ${obligationName}
Status: Submitted to KRA for review

KRA will process this within 5-10 business days. You'll be notified of the outcome.`;

export const STATUS_CHECK_RESULT = (tasks: { type: string; status: string; date: string }[]) => {
  if (tasks.length === 0) return `No recent requests found for your account. How can I help you?`;
  const lines = tasks.map(t => `• ${t.type}: ${t.status} (${t.date})`).join('\n');
  return `📊 *Your Recent Requests*

${lines}

Need anything else?`;
};

export const ERROR_GENERIC = `I'm sorry, something went wrong. Please try again or type *support* to connect with our team.`;

export const SESSION_TIMEOUT = `⏰ Your session has expired due to inactivity.

Type *hi* to start a new session anytime!`;

export const GOODBYE = `Thank you for using Nunge Returns! 🙏

If you need anything else, just send a message anytime.

⭐ Rate us: Was this helpful? Reply with a number 1-5.`;
