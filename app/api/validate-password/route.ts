import { NextResponse } from 'next/server';
import { validateIndividualPassword } from '@/services/passwordValidation';

/**
 * DEPRECATED: This endpoint is maintained for backward compatibility.
 * Use /api/auth/validate-password instead for new implementations.
 * 
 * This now proxies to the Playwright-based validation instead of external Railway API.
 */

interface ValidationResult {
  status: string;
  message: string;
  requiresPasswordReset?: boolean;
  newPassword?: string;
}

export async function POST(request: Request) {
  try {
    const { company_name, kra_pin, kra_password } = await request.json();

    // Validate required fields
    if (!kra_pin || !kra_password) {
      return NextResponse.json(
        { success: false, message: 'KRA PIN and password are required' },
        { status: 400 }
      );
    }

    console.log('[DEPRECATED] /api/validate-password called. Use /api/auth/validate-password instead.');
    console.log(`[DEPRECATED] Validating credentials for PIN: ${kra_pin}, Company: ${company_name || 'Not provided'}`);

    // Use the new Playwright-based validation
    try {
      const result = await validateIndividualPassword(kra_pin, kra_password, undefined) as ValidationResult;

      console.log('[DEPRECATED] Validation result:', result.status);

      // Map new status to old format for backward compatibility
      if (result.status === 'valid') {
        return NextResponse.json({
          success: true,
          message: result.message || 'Login successful',
          status: 'Valid',
          timestamp: new Date().toISOString(),
          company_name: company_name || '',
          kra_pin: kra_pin
        });
      } else if (result.status === 'password_expired') {
        return NextResponse.json({
          success: false,
          message: result.message || 'Password has expired',
          status: 'password_expired',
          requiresPasswordReset: true,
          timestamp: new Date().toISOString()
        }, { status: 401 });
      } else if (result.status === 'locked') {
        return NextResponse.json({
          success: false,
          message: result.message || 'Account is locked',
          status: 'locked',
          timestamp: new Date().toISOString()
        }, { status: 401 });
      } else if (result.status === 'cancelled') {
        return NextResponse.json({
          success: false,
          message: result.message || 'Account is cancelled',
          status: 'cancelled',
          timestamp: new Date().toISOString()
        }, { status: 401 });
      } else {
        return NextResponse.json({
          success: false,
          message: result.message || 'Invalid credentials',
          status: 'Invalid',
          timestamp: new Date().toISOString()
        }, { status: 401 });
      }

    } catch (error: unknown) {
      const apiError = error as Error;
      console.error('[DEPRECATED] Validation error:', apiError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to validate credentials with KRA system',
          error: apiError.message || 'Unknown error occurred',
          status: 'Error'
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[DEPRECATED] Password validation error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: err.message || 'Unknown error',
        status: 'Error'
      },
      { status: 500 }
    );
  }
}
