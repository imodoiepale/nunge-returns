import { z } from 'zod';

// Admin user metrics schema
export const adminUserMetricsSchema = z.object({
  id: z.string().uuid().optional(),
  metric_date: z.date(),
  total_users: z.number().int().nonnegative(),
  active_users: z.number().int().nonnegative(),
  new_users: z.number().int().nonnegative(),
  started_at: z.date().optional().default(() => new Date())
});

// Admin transaction metrics schema
export const adminTransactionMetricsSchema = z.object({
  id: z.string().uuid().optional(),
  metric_date: z.date(),
  total_amount: z.number().nonnegative(),
  transaction_count: z.number().int().nonnegative(),
  success_rate: z.number().min(0).max(100),
  started_at: z.date().optional().default(() => new Date())
});

// Admin return metrics schema
export const adminReturnMetricsSchema = z.object({
  id: z.string().uuid().optional(),
  metric_date: z.date(),
  total_returns: z.number().int().nonnegative(),
  completed_returns: z.number().int().nonnegative(),
  pending_returns: z.number().int().nonnegative(),
  error_returns: z.number().int().nonnegative(),
  average_processing_time: z.number().nonnegative(),
  started_at: z.date().optional().default(() => new Date())
});

// Admin activity log schema
export const adminActivityLogSchema = z.object({
  id: z.string().uuid().optional(),
  admin_id: z.string().uuid(),
  activity_type: z.enum([
    'login',
    'logout',
    'user_management',
    'transaction_management',
    'return_management',
    'report_generation',
    'settings_update',
    'partner_management',
    'system_update'
  ]),
  description: z.string(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date())
});

// Admin dashboard settings schema
export const adminDashboardSettingsSchema = z.object({
  admin_id: z.string().uuid(),
  dashboard_layout: z.array(
    z.object({
      widget_id: z.string(),
      position: z.object({
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        width: z.number().int().positive(),
        height: z.number().int().positive()
      }),
      widget_type: z.enum([
        'user_metrics',
        'transaction_metrics',
        'return_metrics',
        'activity_log',
        'recent_transactions',
        'recent_returns',
        'system_status',
        'kra_status'
      ]),
      widget_settings: z.record(z.any()).optional()
    })
  ),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  notification_settings: z.object({
    email_notifications: z.boolean().default(true),
    browser_notifications: z.boolean().default(true),
    notification_types: z.array(
      z.enum([
        'new_user',
        'new_transaction',
        'failed_transaction',
        'new_return',
        'return_error',
        'system_alert'
      ])
    ).default(['system_alert'])
  }),
  last_updated: z.date().default(() => new Date())
});

// Admin report schema
export const adminReportSchema = z.object({
  id: z.string().uuid().optional(),
  report_name: z.string(),
  report_type: z.enum([
    'user_report',
    'transaction_report',
    'return_report',
    'financial_report',
    'activity_report',
    'custom_report'
  ]),
  created_by: z.string().uuid(),
  created_at: z.date().default(() => new Date()),
  last_run: z.date().optional(),
  schedule: z.enum(['one_time', 'daily', 'weekly', 'monthly', 'quarterly']).optional(),
  next_run: z.date().optional(),
  report_parameters: z.record(z.any()).optional(),
  report_url: z.string().url().optional(),
  is_active: z.boolean().default(true)
});

// KRA status schema
export const kraStatusSchema = z.object({
  id: z.number().int().optional(),
  status: z.enum(['up', 'down', 'degraded']),
  response_time: z.number().int().nonnegative(),
  checked_at: z.date().default(() => new Date()),
  details: z.string().optional()
});

// System status schema
export const systemStatusSchema = z.object({
  id: z.string().uuid().optional(),
  component: z.enum([
    'web_app',
    'api',
    'database',
    'payment_gateway',
    'kra_integration',
    'email_service',
    'sms_service',
    'file_storage'
  ]),
  status: z.enum(['operational', 'degraded', 'outage']),
  message: z.string().optional(),
  last_checked: z.date().default(() => new Date()),
  uptime_percentage: z.number().min(0).max(100).optional()
});

// Admin notification schema
export const adminNotificationSchema = z.object({
  id: z.string().uuid().optional(),
  admin_id: z.string().uuid(),
  notification_type: z.enum([
    'system_alert',
    'new_user',
    'new_transaction',
    'failed_transaction',
    'new_return',
    'return_error',
    'kra_status_change'
  ]),
  title: z.string(),
  message: z.string(),
  is_read: z.boolean().default(false),
  created_at: z.date().default(() => new Date()),
  action_url: z.string().url().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// Activity log item schema (for admin dashboard)
export const activityLogItemSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum([
    'import',
    'export',
    'create',
    'update',
    'delete',
    'report',
    'filter',
    'schedule',
    'auth',
    'user',
    'return',
    'transaction',
    'document',
    'partner',
    'system'
  ]),
  title: z.string(),
  description: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  status: z.enum(['success', 'warning', 'error', 'info', 'pending']),
  user: z.object({
    name: z.string(),
    email: z.string().email()
  }).optional(),
  metadata: z.record(z.any()).optional(),
  read: z.boolean().default(false)
});

// Stat card schema (for admin dashboard)
export const statCardSchema = z.object({
  title: z.string(),
  value: z.union([z.string(), z.number()]),
  icon: z.any(), // React component
  change: z.number().optional(),
  trend: z.enum(['positive', 'negative', 'neutral']).default('neutral'),
  timeFrame: z.string().default('from last month'),
  tooltip: z.string().optional()
});

// Dashboard data schema
export const dashboardDataSchema = z.object({
  overviewData: z.array(statCardSchema),
  returnsTrendData: z.array(
    z.object({
      name: z.string(),
      value: z.number()
    })
  ),
  transactionsTrendData: z.array(
    z.object({
      name: z.string(),
      amount: z.number()
    })
  ),
  userTrendData: z.array(
    z.object({
      name: z.string(),
      users: z.number()
    })
  ),
  documentsTrendData: z.array(
    z.object({
      name: z.string(),
      count: z.number()
    })
  ),
  returnsByTypeData: z.array(
    z.object({
      name: z.string(),
      value: z.number()
    })
  ),
  recentActivities: z.array(activityLogItemSchema),
  reportColumns: z.array(
    z.object({
      accessorKey: z.string(),
      header: z.string()
    })
  ),
  reportData: z.array(z.record(z.any()))
});
