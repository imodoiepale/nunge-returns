import { z } from 'zod';

// Partner schema
export const partnerSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  company_name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  partner_type: z.enum(['cyber', 'university', 'business']),
  commission_rate: z.number().min(0).max(100),
  status: z.enum(['active', 'pending', 'inactive']).default('pending'),
  started_at: z.date().optional().default(() => new Date()),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  physical_address: z.string().optional(),
  county: z.string().optional(),
  registration_documents: z.array(z.string().url()).optional()
});

// Partner transaction schema
export const partnerTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  partner_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  commission_amount: z.number().nonnegative(),
  status: z.enum(['pending', 'paid']).default('pending'),
  started_at: z.date().optional().default(() => new Date()),
  paid_at: z.date().optional(),
  payment_reference: z.string().optional(),
  payment_method: z.enum(['bank_transfer', 'mpesa', 'wallet']).optional()
});

// Partner dashboard schema
export const partnerDashboardSchema = z.object({
  partner_id: z.string().uuid(),
  metrics: z.object({
    total_transactions: z.number().int().nonnegative(),
    total_commission: z.number().nonnegative(),
    pending_commission: z.number().nonnegative(),
    paid_commission: z.number().nonnegative(),
    transaction_count_today: z.number().int().nonnegative(),
    commission_today: z.number().nonnegative(),
    user_count: z.number().int().nonnegative()
  }),
  transaction_history: z.array(
    z.object({
      id: z.string().uuid(),
      amount: z.number().nonnegative(),
      commission_amount: z.number().nonnegative(),
      status: z.enum(['pending', 'paid']),
      created_at: z.date(),
      user: z.object({
        name: z.string(),
        email: z.string().email()
      }).optional()
    })
  ),
  commission_trend: z.array(
    z.object({
      date: z.string(),
      amount: z.number().nonnegative()
    })
  )
});

// Partner application schema
export const partnerApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  company_name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  partner_type: z.enum(['cyber', 'university', 'business']),
  business_registration_number: z.string(),
  contact_person: z.string(),
  contact_email: z.string().email(),
  contact_phone: z.string(),
  physical_address: z.string(),
  county: z.string(),
  reason_for_partnership: z.string(),
  expected_transaction_volume: z.string(),
  website: z.string().url().optional(),
  social_media_links: z.array(z.string().url()).optional(),
  documents: z.array(
    z.object({
      document_type: z.enum(['business_registration', 'tax_compliance', 'id_document', 'other']),
      document_url: z.string().url(),
      document_name: z.string()
    })
  ),
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected']).default('submitted'),
  submitted_at: z.date().default(() => new Date()),
  reviewed_at: z.date().optional(),
  reviewed_by: z.string().uuid().optional(),
  review_notes: z.string().optional()
});

// Partner payout schema
export const partnerPayoutSchema = z.object({
  id: z.string().uuid().optional(),
  partner_id: z.string().uuid(),
  amount: z.number().positive(),
  payout_date: z.date(),
  status: z.enum(['scheduled', 'processing', 'completed', 'failed']).default('scheduled'),
  payment_method: z.enum(['bank_transfer', 'mpesa', 'wallet']),
  reference_number: z.string().optional(),
  transaction_ids: z.array(z.string().uuid()),
  created_at: z.date().default(() => new Date()),
  completed_at: z.date().optional(),
  notes: z.string().optional()
});

// Partner referral schema
export const partnerReferralSchema = z.object({
  id: z.string().uuid().optional(),
  partner_id: z.string().uuid(),
  referral_code: z.string(),
  referral_url: z.string().url(),
  discount_percent: z.number().int().min(0).max(100).optional(),
  is_active: z.boolean().default(true),
  created_at: z.date().default(() => new Date()),
  expires_at: z.date().optional(),
  max_uses: z.number().int().positive().optional(),
  current_uses: z.number().int().nonnegative().default(0)
});

// Partner user schema (users referred by partners)
export const partnerUserSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  partner_id: z.string().uuid(),
  referral_id: z.string().uuid().optional(),
  joined_at: z.date().default(() => new Date()),
  first_transaction_id: z.string().uuid().optional(),
  first_transaction_date: z.date().optional(),
  lifetime_transaction_value: z.number().nonnegative().default(0),
  transaction_count: z.number().int().nonnegative().default(0)
});

// Partner analytics schema
export const partnerAnalyticsSchema = z.object({
  partner_id: z.string().uuid(),
  date: z.date(),
  new_users: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  transaction_count: z.number().int().nonnegative(),
  transaction_value: z.number().nonnegative(),
  commission_earned: z.number().nonnegative(),
  conversion_rate: z.number().min(0).max(100).optional()
});
