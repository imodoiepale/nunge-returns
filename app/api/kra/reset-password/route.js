import { NextResponse } from 'next/server';
import {
    launchBrowser,
    loginToKRA,
    handleFirstTimeLogin,
    handlePasswordExpiry,
    triggerPasswordResetViaEmail,
    logoutSafely
} from '@/services/kra-utils';

/**
 * POST /api/kra/reset-password
 * 
 * Flow:
 * 1. Trigger forgot password on KRA portal → KRA sends recovery password to user's email
 * 2. User provides the recovery password they received
 * 3. Login with recovery password → first-time login flow → set new password
 * 
 * Request body:
 * - pin: KRA PIN
 * - step: 'trigger' | 'complete'
 * - recoveryPassword: (for step=complete) the recovery password from email
 * - newPassword: (for step=complete) the user's preferred new password
 */
export async function POST(request) {
    const startTime = Date.now();
    let browser = null;

    try {
        const body = await request.json();
        const { pin, step, recoveryPassword, newPassword } = body;

        console.log(`[API] POST /api/kra/reset-password - step: ${step}, PIN: ${pin}`);

        if (!pin) {
            return NextResponse.json(
                { error: 'PIN is required' },
                { status: 400 }
            );
        }

        // Step 1: Trigger password reset via email
        if (step === 'trigger') {
            console.log('[RESET] Step 1: Triggering password reset via email...');

            const { browser: b, context, page } = await launchBrowser(false);
            browser = b;

            const result = await triggerPasswordResetViaEmail(page, pin);

            await context.close();
            await browser.close();
            browser = null;

            const duration = Date.now() - startTime;
            console.log(`[RESET] Trigger completed in ${duration}ms:`, result);

            return NextResponse.json({
                success: result.success,
                message: result.message,
                step: 'trigger',
                duration
            });
        }

        // Step 2: Complete password reset - login with recovery password, set new one
        if (step === 'complete') {
            if (!recoveryPassword) {
                return NextResponse.json(
                    { error: 'Recovery password is required' },
                    { status: 400 }
                );
            }

            if (!newPassword) {
                return NextResponse.json(
                    { error: 'New password is required' },
                    { status: 400 }
                );
            }

            // Validate new password strength
            if (newPassword.length < 8) {
                return NextResponse.json(
                    { error: 'New password must be at least 8 characters' },
                    { status: 400 }
                );
            }

            console.log('[RESET] Step 2: Logging in with recovery password...');

            const { browser: b, context, page } = await launchBrowser(false);
            browser = b;

            // Try to login with recovery password
            const loginResult = await loginToKRA(page, pin, recoveryPassword);
            console.log('[RESET] Login result:', loginResult);

            if (loginResult.status === 'first_time_login') {
                // First-time login flow: set new password + security question
                console.log('[RESET] First-time login detected, setting new password...');
                const setResult = await handleFirstTimeLogin(page, recoveryPassword, newPassword);

                await logoutSafely(page);
                await context.close();
                await browser.close();
                browser = null;

                const duration = Date.now() - startTime;

                if (setResult.success) {
                    console.log(`[RESET] Password reset completed successfully in ${duration}ms`);
                    return NextResponse.json({
                        success: true,
                        message: 'Password has been reset successfully. You can now login with your new password.',
                        newPassword,
                        step: 'complete',
                        duration
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        error: `Failed to set new password: ${setResult.error}`,
                        step: 'complete',
                        duration
                    });
                }
            }

            if (loginResult.status === 'password_expired') {
                // Password expired flow
                console.log('[RESET] Password expired, setting new password...');
                const resetResult = await handlePasswordExpiry(page, recoveryPassword, newPassword);

                await logoutSafely(page);
                await context.close();
                await browser.close();
                browser = null;

                const duration = Date.now() - startTime;

                if (resetResult.success) {
                    return NextResponse.json({
                        success: true,
                        message: 'Password has been reset successfully.',
                        newPassword,
                        step: 'complete',
                        duration
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        error: `Failed to reset password: ${resetResult.error}`,
                        step: 'complete',
                        duration
                    });
                }
            }

            if (loginResult.status === 'valid') {
                // Recovery password worked as normal login — user is already in
                await logoutSafely(page);
                await context.close();
                await browser.close();
                browser = null;

                const duration = Date.now() - startTime;
                return NextResponse.json({
                    success: true,
                    message: 'Login successful with recovery password. The recovery password is your current password.',
                    newPassword: recoveryPassword,
                    step: 'complete',
                    duration
                });
            }

            // Other statuses (locked, cancelled, invalid, etc.)
            await context.close();
            await browser.close();
            browser = null;

            const duration = Date.now() - startTime;
            return NextResponse.json({
                success: false,
                error: loginResult.message || 'Failed to login with recovery password',
                loginStatus: loginResult.status,
                step: 'complete',
                duration
            });
        }

        return NextResponse.json(
            { error: 'Invalid step. Use "trigger" or "complete".' },
            { status: 400 }
        );

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[API] Reset password failed after ${duration}ms:`, error);

        if (browser) {
            try { await browser.close(); } catch (e) {}
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Password reset failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
