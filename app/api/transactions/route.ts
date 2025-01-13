import { NextResponse } from 'next/server';

interface PaymentResponse {
    success: boolean;
    data?: {
        MerchantRequestID: string;
        status: 'completed' | 'insufficient_balance' | 'cancelled_by_user' | 'timeout' | 'failed' | 'pending';
        transaction_code?: string;
        result_description?: string;
        amount?: string;
        phoneNumber?: string;
        timestamp?: string;
    };
    message?: string;
}

export async function POST(request: Request) {
    try {
        const { phoneNumber, amount } = await request.json();

        // Validate phone number and amount
        if (!phoneNumber || !amount) {
            return NextResponse.json({
                success: false,
                message: 'Phone number and amount are required'
            }, { status: 400 });
        }

        // Call external M-Pesa API
        const response = await fetch('https://mpesa-stk-lc7z.onrender.com/api/initiate-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber,
                amount
            })
        });

        const data: PaymentResponse = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Payment initiation error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to initiate payment'
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const merchantRequestId = searchParams.get('merchantRequestId');

        if (!merchantRequestId) {
            return NextResponse.json({
                success: false,
                message: 'Merchant Request ID is required'
            }, { status: 400 });
        }

        const response = await fetch(
            `https://mpesa-stk-lc7z.onrender.com/api/check-status/${merchantRequestId}`
        );

        const data: PaymentResponse = await response.json();

        // Enhanced response with specific status codes based on payment status
        if (data.success && data.data) {
            const { status } = data.data;
            let statusCode = 200;

            switch (status) {
                case 'completed':
                    statusCode = 200;
                    break;
                case 'pending':
                    statusCode = 202;
                    break;
                case 'insufficient_balance':
                case 'cancelled_by_user':
                case 'failed':
                    statusCode = 400;
                    break;
                case 'timeout':
                    statusCode = 408;
                    break;
            }

            return NextResponse.json(data, { status: statusCode });
        }

        return NextResponse.json({
            success: false,
            message: 'Unable to retrieve payment status'
        }, { status: 500 });

    } catch (error) {
        console.error('Payment status check error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to check payment status'
        }, { status: 500 });
    }
}
