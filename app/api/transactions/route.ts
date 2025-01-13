import { NextResponse } from 'next/server';

const MPESA_API_URL = 'https://mpesa-stk-lc7z.onrender.com/api';

export async function POST(request: Request) {
    try {
        const { phoneNumber, amount } = await request.json();

        // Validate input
        if (!phoneNumber || !amount) {
            return NextResponse.json(
                { success: false, message: 'Phone number and amount are required' },
                { status: 400 }
            );
        }

        // Initiate payment
        const response = await fetch(`${MPESA_API_URL}/initiate-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber, amount })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to initiate payment');
        }

        return NextResponse.json({
            success: true,
            data: data.data,
            message: 'Payment initiated successfully'
        });
    } catch (error: any) {
        console.error('Payment initiation error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const merchantRequestId = searchParams.get('merchantRequestId');

        if (!merchantRequestId) {
            return NextResponse.json(
                { success: false, message: 'Merchant request ID is required' },
                { status: 400 }
            );
        }

        // Check payment status
        const response = await fetch(`${MPESA_API_URL}/check-status/${merchantRequestId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to check payment status');
        }

        return NextResponse.json({
            success: true,
            data: data.data,
            message: 'Payment status retrieved successfully'
        });
    } catch (error: any) {
        console.error('Payment status check error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
