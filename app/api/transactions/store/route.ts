// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();
    
    // Validate required fields
    if (!paymentData.userId || !paymentData.amount || !paymentData.transactionId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required payment data'
      }, { status: 400 });
    }
    
    // Store payment data in database
    const result = await databaseService.storePaymentData(paymentData);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to store payment data',
        error: result.error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment data stored successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('Error storing payment data:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error while storing payment data'
    }, { status: 500 });
  }
}
