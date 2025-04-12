import { supabase } from '../supabaseClient';
import AnalyticsService from '../analyticsService';

const analyticsService = new AnalyticsService();

/**
 * DatabaseService handles all database operations for the application
 * including storing and retrieving user sessions, payments, documents, etc.
 */
class DatabaseService {
  /**
   * Store user session data in the database
   * @param {Object} sessionData - User session data
   * @returns {Promise<Object>} - Result of the operation
   */
  async storeUserSession(sessionData) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert([
          {
            user_id: sessionData.userId,
            session_start: new Date().toISOString(),
            device_info: sessionData.deviceInfo || 'unknown',
            ip_address: sessionData.ipAddress || 'unknown',
            is_active: true
          }
        ]);
      
      if (error) throw error;
      
      // Track analytics
      await analyticsService.trackUserActivity(sessionData.userId);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error storing user session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store payment information in the database
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Result of the operation
   */
  async storePaymentData(paymentData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            user_id: paymentData.userId,
            amount: paymentData.amount,
            transaction_id: paymentData.transactionId,
            payment_method: paymentData.paymentMethod,
            status: paymentData.status,
            payment_date: new Date().toISOString(),
            merchant_request_id: paymentData.merchantRequestId || null,
            phone_number: paymentData.phoneNumber || null
          }
        ]);
      
      if (error) throw error;
      
      // Track analytics
      await analyticsService.trackTransaction(
        parseFloat(paymentData.amount), 
        paymentData.status === 'completed'
      );
      
      return { success: true, data };
    } catch (error) {
      console.error('Error storing payment data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store document metadata in the database
   * @param {Object} documentData - Document metadata
   * @returns {Promise<Object>} - Result of the operation
   */
  async storeDocumentData(documentData) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            user_id: documentData.userId,
            document_type: documentData.documentType,
            file_name: documentData.fileName,
            file_path: documentData.filePath,
            upload_date: new Date().toISOString(),
            status: documentData.status || 'pending_review',
            metadata: documentData.metadata || {}
          }
        ]);
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error storing document data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store tax return data in the database
   * @param {Object} returnData - Tax return data
   * @returns {Promise<Object>} - Result of the operation
   */
  async storeTaxReturnData(returnData) {
    try {
      const { data, error } = await supabase
        .from('tax_returns')
        .insert([
          {
            user_id: returnData.userId,
            return_type: returnData.returnType,
            tax_period: returnData.taxPeriod,
            submission_date: new Date().toISOString(),
            status: returnData.status || 'submitted',
            pin: returnData.pin,
            is_individual: returnData.isIndividual,
            details: returnData.details || {}
          }
        ]);
      
      if (error) throw error;
      
      // Track analytics
      await analyticsService.trackReturnCompletion(returnData.status);
      await analyticsService.trackPinUsage(returnData.returnType, returnData.isIndividual);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error storing tax return data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user dashboard data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Dashboard data
   */
  async getUserDashboardData(userId) {
    try {
      // Get user's tax returns
      const { data: returns, error: returnsError } = await supabase
        .from('tax_returns')
        .select('*')
        .eq('user_id', userId)
        .order('submission_date', { ascending: false });
      
      if (returnsError) throw returnsError;
      
      // Get user's payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      
      // Get user's documents
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false });
      
      if (documentsError) throw documentsError;
      
      return {
        success: true,
        data: {
          returns,
          payments,
          documents
        }
      };
    } catch (error) {
      console.error('Error fetching user dashboard data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get admin dashboard data
   * @returns {Promise<Object>} - Admin dashboard data
   */
  async getAdminDashboardData() {
    try {
      // Get analytics data
      const analyticsData = await analyticsService.getDashboardMetrics();
      
      // Get recent tax returns
      const { data: recentReturns, error: returnsError } = await supabase
        .from('tax_returns')
        .select('*')
        .order('submission_date', { ascending: false })
        .limit(10);
      
      if (returnsError) throw returnsError;
      
      // Get recent payments
      const { data: recentPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(10);
      
      if (paymentsError) throw paymentsError;
      
      // Get recent documents
      const { data: recentDocuments, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(10);
      
      if (documentsError) throw documentsError;
      
      return {
        success: true,
        data: {
          analytics: analyticsData,
          recentReturns,
          recentPayments,
          recentDocuments
        }
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DatabaseService();
