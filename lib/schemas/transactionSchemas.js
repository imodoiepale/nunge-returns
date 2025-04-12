import { z } from 'zod';

// Base transaction schema
export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  amount: z.number().positive({ message: "Amount must be greater than 0" }),
  payment_method: z.enum(['mpesa', 'card', 'bank_transfer', 'wallet', 'other']),
  mpesa_code: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  started_at: z.date().optional().default(() => new Date()),
  updated_at: z.date().optional().default(() => new Date()),
  reference_number: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Payment plan schema
export const paymentPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  features: z.array(z.string()),
  is_active: z.boolean().default(true),
  created_at: z.date().optional().default(() => new Date()),
  updated_at: z.date().optional().default(() => new Date())
});

// Coupon schema
export const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(3).max(20),
  discount_percent: z.number().int().min(1).max(100),
  valid_from: z.date(),
  valid_until: z.date(),
  max_uses: z.number().int().positive().optional(),
  current_uses: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional().default(() => new Date())
});

// M-Pesa payment request schema
export const mpesaPaymentRequestSchema = z.object({
  phone_number: z.string().regex(/^254[0-9]{9}$/, { message: "Phone number must be in the format 254XXXXXXXXX" }),
  amount: z.number().positive({ message: "Amount must be greater than 0" }),
  account_reference: z.string(),
  transaction_desc: z.string().optional(),
  callback_url: z.string().url().optional()
});

// M-Pesa callback schema
export const mpesaCallbackSchema = z.object({
  MerchantRequestID: z.string(),
  CheckoutRequestID: z.string(),
  ResultCode: z.number().int(),
  ResultDesc: z.string(),
  CallbackMetadata: z.object({
    Item: z.array(
      z.object({
        Name: z.string(),
        Value: z.union([z.string(), z.number()])
      })
    ).optional()
  }).optional()
});

// Card payment schema
export const cardPaymentSchema = z.object({
  card_number: z.string().regex(/^[0-9]{16}$/, { message: "Card number must be 16 digits" }),
  expiry_month: z.string().regex(/^(0[1-9]|1[0-2])$/, { message: "Expiry month must be between 01 and 12" }),
  expiry_year: z.string().regex(/^[0-9]{2}$/, { message: "Expiry year must be 2 digits" }),
  cvv: z.string().regex(/^[0-9]{3,4}$/, { message: "CVV must be 3 or 4 digits" }),
  card_holder_name: z.string(),
  amount: z.number().positive({ message: "Amount must be greater than 0" }),
  currency: z.string().default("KES")
});

// Transaction receipt schema
export const transactionReceiptSchema = z.object({
  id: z.string().uuid().optional(),
  transaction_id: z.string().uuid(),
  receipt_number: z.string(),
  receipt_date: z.date().default(() => new Date()),
  receipt_url: z.string().url().optional(),
  is_sent: z.boolean().default(false),
  sent_at: z.date().optional()
});

// Wallet schema
export const walletSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  balance: z.number().nonnegative().default(0),
  last_transaction_id: z.string().uuid().optional(),
  created_at: z.date().optional().default(() => new Date()),
  updated_at: z.date().optional().default(() => new Date())
});

// Wallet transaction schema
export const walletTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  wallet_id: z.string().uuid(),
  amount: z.number(),
  transaction_type: z.enum(['deposit', 'withdrawal', 'payment', 'refund']),
  reference_id: z.string().uuid().optional(),
  description: z.string(),
  balance_before: z.number().nonnegative(),
  balance_after: z.number().nonnegative(),
  created_at: z.date().default(() => new Date())
});

// Payment verification schema
export const paymentVerificationSchema = z.object({
  transaction_id: z.string().uuid(),
  verification_method: z.enum(['manual', 'automatic', 'callback']),
  verification_status: z.enum(['pending', 'verified', 'rejected']),
  verified_by: z.string().uuid().optional(),
  verification_date: z.date().optional(),
  verification_notes: z.string().optional()
});
