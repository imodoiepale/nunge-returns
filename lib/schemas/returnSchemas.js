import { z } from 'zod';

// Base tax return schema
export const baseReturnSchema = z.object({
  id: z.string().uuid().optional(),
  session_id: z.string().uuid(),
  pin_id: z.string().uuid(),
  status: z.enum(['draft', 'pending', 'submitted', 'processing', 'completed', 'error']).default('draft'),
  submission_date: z.date().optional(),
  return_period: z.string().regex(/^\d{4}-\d{2}$/, { message: "Return period must be in YYYY-MM format" }),
  started_at: z.date().optional().default(() => new Date()),
  completed_at: z.date().optional(),
  acknowledgment_number: z.string().optional(),
  payment_status: z.enum(['unpaid', 'partial', 'paid']).default('unpaid'),
  amount_due: z.number().nonnegative().optional(),
  amount_paid: z.number().nonnegative().default(0),
  filing_type: z.enum(['original', 'amended']).default('original'),
  amended_return_id: z.string().uuid().optional(),
  is_nil_return: z.boolean().default(false)
});

// Individual return schema
export const individualReturnSchema = baseReturnSchema.extend({
  return_type: z.literal('individual'),
  return_data: z.object({
    // Personal Information
    taxpayer_name: z.string(),
    id_number: z.string(),
    
    // Employment Income
    employment_income: z.object({
      basic_salary: z.number().nonnegative().default(0),
      cash_allowances: z.number().nonnegative().default(0),
      non_cash_benefits: z.number().nonnegative().default(0),
      total_gross_pay: z.number().nonnegative().default(0)
    }),
    
    // Deductions
    deductions: z.object({
      paye: z.number().nonnegative().default(0),
      pension_contribution: z.number().nonnegative().default(0),
      nhif: z.number().nonnegative().default(0),
      nssf: z.number().nonnegative().default(0),
      other_deductions: z.number().nonnegative().default(0),
      total_deductions: z.number().nonnegative().default(0)
    }),
    
    // Other Income
    other_income: z.object({
      business_income: z.number().nonnegative().default(0),
      rental_income: z.number().nonnegative().default(0),
      investment_income: z.number().nonnegative().default(0),
      capital_gains: z.number().nonnegative().default(0),
      other: z.number().nonnegative().default(0),
      total_other_income: z.number().nonnegative().default(0)
    }),
    
    // Tax Relief
    tax_relief: z.object({
      insurance_relief: z.number().nonnegative().default(0),
      mortgage_interest: z.number().nonnegative().default(0),
      disability_exemption: z.number().nonnegative().default(0),
      home_ownership_savings_plan: z.number().nonnegative().default(0),
      other_relief: z.number().nonnegative().default(0),
      total_relief: z.number().nonnegative().default(0)
    }),
    
    // Summary
    summary: z.object({
      total_income: z.number().nonnegative().default(0),
      total_tax_payable: z.number().nonnegative().default(0),
      total_tax_relief: z.number().nonnegative().default(0),
      net_tax_payable: z.number().nonnegative().default(0),
      tax_already_paid: z.number().nonnegative().default(0),
      tax_due_or_refund: z.number().default(0)
    })
  })
});

// Business return schema
export const businessReturnSchema = baseReturnSchema.extend({
  return_type: z.literal('business'),
  return_data: z.object({
    // Business Information
    business_name: z.string(),
    registration_number: z.string(),
    business_type: z.enum(['sole_proprietorship', 'partnership', 'limited_company', 'other']),
    
    // Income
    income: z.object({
      gross_sales: z.number().nonnegative().default(0),
      cost_of_sales: z.number().nonnegative().default(0),
      gross_profit: z.number().nonnegative().default(0),
      other_income: z.number().nonnegative().default(0),
      total_income: z.number().nonnegative().default(0)
    }),
    
    // Expenses
    expenses: z.object({
      salaries_and_wages: z.number().nonnegative().default(0),
      rent_and_rates: z.number().nonnegative().default(0),
      utilities: z.number().nonnegative().default(0),
      repairs_and_maintenance: z.number().nonnegative().default(0),
      motor_vehicle_expenses: z.number().nonnegative().default(0),
      travel_and_accommodation: z.number().nonnegative().default(0),
      printing_and_stationery: z.number().nonnegative().default(0),
      legal_and_professional_fees: z.number().nonnegative().default(0),
      insurance: z.number().nonnegative().default(0),
      bank_charges: z.number().nonnegative().default(0),
      depreciation: z.number().nonnegative().default(0),
      bad_debts: z.number().nonnegative().default(0),
      other_expenses: z.number().nonnegative().default(0),
      total_expenses: z.number().nonnegative().default(0)
    }),
    
    // VAT
    vat: z.object({
      vat_on_sales: z.number().nonnegative().default(0),
      vat_on_purchases: z.number().nonnegative().default(0),
      vat_payable: z.number().default(0)
    }),
    
    // Summary
    summary: z.object({
      net_profit_before_tax: z.number().default(0),
      tax_payable: z.number().nonnegative().default(0),
      tax_already_paid: z.number().nonnegative().default(0),
      tax_due_or_refund: z.number().default(0)
    })
  })
});

// Corporate return schema
export const corporateReturnSchema = baseReturnSchema.extend({
  return_type: z.literal('corporate'),
  return_data: z.object({
    // Company Information
    company_name: z.string(),
    registration_number: z.string(),
    
    // Income
    income: z.object({
      gross_sales: z.number().nonnegative().default(0),
      cost_of_sales: z.number().nonnegative().default(0),
      gross_profit: z.number().nonnegative().default(0),
      other_income: z.number().nonnegative().default(0),
      total_income: z.number().nonnegative().default(0)
    }),
    
    // Expenses
    expenses: z.object({
      salaries_and_wages: z.number().nonnegative().default(0),
      directors_remuneration: z.number().nonnegative().default(0),
      rent_and_rates: z.number().nonnegative().default(0),
      utilities: z.number().nonnegative().default(0),
      repairs_and_maintenance: z.number().nonnegative().default(0),
      motor_vehicle_expenses: z.number().nonnegative().default(0),
      travel_and_accommodation: z.number().nonnegative().default(0),
      printing_and_stationery: z.number().nonnegative().default(0),
      legal_and_professional_fees: z.number().nonnegative().default(0),
      insurance: z.number().nonnegative().default(0),
      bank_charges: z.number().nonnegative().default(0),
      depreciation: z.number().nonnegative().default(0),
      bad_debts: z.number().nonnegative().default(0),
      other_expenses: z.number().nonnegative().default(0),
      total_expenses: z.number().nonnegative().default(0)
    }),
    
    // Balance Sheet
    balance_sheet: z.object({
      // Assets
      assets: z.object({
        non_current_assets: z.number().nonnegative().default(0),
        current_assets: z.number().nonnegative().default(0),
        total_assets: z.number().nonnegative().default(0)
      }),
      
      // Liabilities
      liabilities: z.object({
        non_current_liabilities: z.number().nonnegative().default(0),
        current_liabilities: z.number().nonnegative().default(0),
        total_liabilities: z.number().nonnegative().default(0)
      }),
      
      // Equity
      equity: z.object({
        share_capital: z.number().nonnegative().default(0),
        retained_earnings: z.number().default(0),
        total_equity: z.number().default(0)
      })
    }),
    
    // Summary
    summary: z.object({
      net_profit_before_tax: z.number().default(0),
      corporation_tax: z.number().nonnegative().default(0),
      tax_already_paid: z.number().nonnegative().default(0),
      tax_due_or_refund: z.number().default(0)
    })
  })
});

// Return document schema
export const returnDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  return_id: z.string().uuid(),
  document_type: z.enum([
    'p9_form',
    'bank_statement',
    'payment_receipt',
    'financial_statement',
    'supporting_document',
    'other'
  ]),
  document_name: z.string(),
  document_url: z.string().url(),
  uploaded_at: z.date().default(() => new Date()),
  file_size: z.number().positive(),
  file_type: z.string(),
  is_verified: z.boolean().default(false)
});

// Return history schema
export const returnHistorySchema = z.object({
  id: z.string().uuid().optional(),
  return_id: z.string().uuid(),
  action: z.enum([
    'created',
    'updated',
    'submitted',
    'approved',
    'rejected',
    'payment_made',
    'document_added',
    'status_changed'
  ]),
  description: z.string(),
  performed_by: z.string().uuid(), // User ID
  performed_at: z.date().default(() => new Date()),
  metadata: z.record(z.any()).optional()
});

// Return notification schema
export const returnNotificationSchema = z.object({
  id: z.string().uuid().optional(),
  return_id: z.string().uuid(),
  user_id: z.string().uuid(),
  notification_type: z.enum([
    'submission_confirmation',
    'processing_update',
    'completion_notice',
    'payment_reminder',
    'document_request',
    'error_notification'
  ]),
  message: z.string(),
  is_read: z.boolean().default(false),
  created_at: z.date().default(() => new Date())
});
