import { z } from 'zod';

// Base user schema
export const userSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new users
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: "Invalid phone number" }),
  role: z.enum(['user', 'admin', 'partner', 'enterprise']).default('user'),
  started_at: z.date().optional(),
  updated_at: z.date().optional()
});

// User preferences schema
export const userPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  notifications_enabled: z.boolean().default(true),
  email_notifications: z.boolean().default(true)
});

// PIN schema for KRA integration
export const pinSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  pin_number: z.string().regex(/^[A-Z0-9]{11}$/, { message: "PIN must be 11 characters" }),
  pin_type: z.enum(['A', 'P']),
  is_individual: z.boolean(),
  business_details: z.object({
    business_name: z.string().optional(),
    registration_number: z.string().optional(),
    business_type: z.enum(['sole_proprietorship', 'partnership', 'limited_company', 'other']).optional(),
    industry: z.string().optional(),
    registration_date: z.string().optional(),
    physical_address: z.string().optional(),
    postal_address: z.string().optional(),
    county: z.string().optional(),
    sub_county: z.string().optional()
  }).optional(),
  started_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Individual user profile schema (extends user)
export const individualProfileSchema = z.object({
  user_id: z.string().uuid(),
  id_number: z.string().regex(/^[0-9]{8}$/, { message: "ID number must be 8 digits" }),
  date_of_birth: z.string(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed', 'other']),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  physical_address: z.string().optional(),
  postal_address: z.string().optional(),
  county: z.string().optional(),
  sub_county: z.string().optional()
});

// Business profile schema
export const businessProfileSchema = z.object({
  user_id: z.string().uuid(),
  pin_id: z.string().uuid(),
  business_name: z.string(),
  registration_number: z.string(),
  business_type: z.enum(['sole_proprietorship', 'partnership', 'limited_company', 'other']),
  industry: z.string(),
  registration_date: z.string(),
  physical_address: z.string(),
  postal_address: z.string().optional(),
  county: z.string(),
  sub_county: z.string(),
  contact_person: z.string(),
  contact_email: z.string().email(),
  contact_phone: z.string().regex(/^\+?[0-9]{10,15}$/, { message: "Invalid phone number" })
});

// User registration schema (for sign up)
export const userRegistrationSchema = userSchema.omit({ id: true, started_at: true, updated_at: true })
  .extend({
    password: z.string().min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" })
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email address" })
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
