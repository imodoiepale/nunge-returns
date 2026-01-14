import { NextRequest, NextResponse } from 'next/server';
import { validateIndividualPassword } from '@/services/passwordValidation';

interface ValidationResult {
    status: string;
    message: string;
    requiresPasswordReset?: boolean;
    newPassword?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { pin, password, newPassword } = await request.json();

        if (!pin || !password) {
            return NextResponse.json(
                { error: 'PIN and password are required' },
                { status: 400 }
            );
        }

        console.log(`[API] Validating password for PIN: ${pin}`);

        const result = await validateIndividualPassword(pin, password, newPassword) as ValidationResult;

        return NextResponse.json({
            success: result.status === 'valid',
            status: result.status,
            message: result.message,
            requiresPasswordReset: result.requiresPasswordReset || false,
            newPassword: result.newPassword || null
        });

    } catch (error: any) {
        console.error('[API] Error validating password:', error);
        return NextResponse.json(
            { error: 'Failed to validate password', details: error?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
