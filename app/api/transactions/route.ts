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
        checkout_request_id?: string;
        result_code?: string | null;
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

        const data = await response.json();

        // Validate the status and transaction code
        const isCompleted = data.data.status === 'completed' && 
                          data.data.transaction_code && 
                          data.data.transaction_code.length > 0;

        // Map the API response to our expected format
        const mappedResponse: PaymentResponse = {
            success: data.success,
            data: {
                MerchantRequestID: data.data.merchant_request_id,
                status: isCompleted ? 'completed' : data.data.status,
                transaction_code: data.data.transaction_code,
                result_description: data.data.result_description,
                amount: data.data.amount?.toString(),
                result_code: data.data.result_code
            }
        };

        // Determine HTTP status code based on payment status
        let statusCode = 200;
        if (!isCompleted && data.data.status === 'pending') {
            statusCode = 202;
        } else if (data.data.status === 'failed' || data.data.result_code === '1') {
            statusCode = 400;
        }

        return NextResponse.json(mappedResponse, { status: statusCode });

    } catch (error) {
        console.error('Payment status check error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to check payment status'
        }, { status: 500 });
    }
}
