import { z } from 'zod';

// Base session schema
export const sessionSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new sessions
  user_id: z.string().uuid(),
  pin: z.string().optional(),
  status: z.enum(['active', 'completed', 'error']).default('active'),
  started_at: z.date().optional().default(() => new Date()),
  completed_at: z.date().optional(),
  last_step: z.string().optional(),
  form_data: z.record(z.any()).optional(),
  error_message: z.string().optional()
});

// Session step tracking schema
export const sessionStepSchema = z.object({
  session_id: z.string().uuid(),
  step_name: z.string(),
  step_data: z.record(z.any()).optional(),
  is_completed: z.boolean().default(false),
  started_at: z.date().default(() => new Date()),
  completed_at: z.date().optional()
});

// Session activity log schema
export const sessionActivitySchema = z.object({
  id: z.string().uuid().optional(),
  session_id: z.string().uuid(),
  activity_type: z.enum([
    'session_start',
    'session_complete',
    'session_error',
    'form_submit',
    'payment_initiated',
    'payment_complete',
    'pin_validated',
    'return_submitted',
    'return_completed',
    'document_uploaded',
    'user_action'
  ]),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date())
});

// Session recovery schema
export const sessionRecoverySchema = z.object({
  session_id: z.string().uuid(),
  recovery_token: z.string(),
  expires_at: z.date(),
  is_used: z.boolean().default(false),
  created_at: z.date().default(() => new Date())
});

// Session timeout configuration
export const sessionTimeoutSchema = z.object({
  timeout_minutes: z.number().int().positive().default(30),
  warning_minutes: z.number().int().positive().default(5),
  extend_on_activity: z.boolean().default(true)
});

// Session state management schema
export const sessionStateSchema = z.object({
  current_step: z.string(),
  completed_steps: z.array(z.string()),
  form_data: z.record(z.any()).default({}),
  validation_errors: z.record(z.array(z.string())).optional(),
  is_valid: z.boolean().default(false),
  last_active: z.date().default(() => new Date()),
  progress_percentage: z.number().min(0).max(100).default(0)
});

// Session resumption data schema
export const sessionResumptionSchema = z.object({
  session_id: z.string().uuid(),
  resumption_point: z.string(),
  saved_data: z.record(z.any()),
  created_at: z.date().default(() => new Date()),
  expires_at: z.date()
});
