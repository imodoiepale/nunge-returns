import { supabase } from '../supabaseClient';
import AnalyticsService from '../analyticsService';
import * as schemas from '../schemas';

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

  // ==================== USER MANAGEMENT ====================
  
  /**
   * Create a new user
   * @param {Object} userData - User data validated with userSchema
   * @returns {Promise<Object>} - Result of the operation
   */
  async createUser(userData) {
    try {
      // Validate data using schema
      const validatedData = schemas.userSchema.parse(userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert([validatedData])
        .select();
      
      if (error) throw error;
      
      // Create user preferences
      await this.createUserPreferences({ user_id: data[0].id });
      
      // Track new user in analytics
      await analyticsService.trackNewUser(data[0].id);
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateUser(userId, userData) {
    try {
      // Validate data using schema
      const validatedData = schemas.userSchema.partial().parse(userData);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create user preferences
   * @param {Object} preferencesData - User preferences data
   * @returns {Promise<Object>} - Result of the operation
   */
  async createUserPreferences(preferencesData) {
    try {
      // Validate data using schema
      const validatedData = schemas.userPreferencesSchema.parse(preferencesData);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([validatedData])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating user preferences:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferencesData - User preferences data to update
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateUserPreferences(userId, preferencesData) {
    try {
      // Validate data using schema
      const validatedData = schemas.userPreferencesSchema.partial().parse(preferencesData);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .update(validatedData)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== PIN MANAGEMENT ====================
  
  /**
   * Create a new PIN
   * @param {Object} pinData - PIN data validated with pinSchema
   * @returns {Promise<Object>} - Result of the operation
   */
  async createPin(pinData) {
    try {
      // Validate data using schema
      const validatedData = schemas.pinSchema.parse(pinData);
      
      const { data, error } = await supabase
        .from('pins')
        .insert([validatedData])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating PIN:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get PINs by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getPinsByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting PINs:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get PIN by PIN number
   * @param {string} pinNumber - PIN number
   * @returns {Promise<Object>} - Result of the operation
   */
  async getPinByPinNumber(pinNumber) {
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('pin_number', pinNumber)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting PIN:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== SESSION MANAGEMENT ====================
  
  /**
   * Create a new session
   * @param {Object} sessionData - Session data validated with sessionSchema
   * @returns {Promise<Object>} - Result of the operation
   */
  async createSession(sessionData) {
    try {
      // Validate data using schema
      const validatedData = schemas.sessionSchema.parse(sessionData);
      
      const { data, error } = await supabase
        .from('sessions')
        .insert([validatedData])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getSessionById(sessionId) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting session:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data to update
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateSession(sessionId, sessionData) {
    try {
      // Validate data using schema
      const validatedData = schemas.sessionSchema.partial().parse(sessionData);
      
      const { data, error } = await supabase
        .from('sessions')
        .update(validatedData)
        .eq('id', sessionId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Complete session
   * @param {string} sessionId - Session ID
   * @param {string} status - Session status (completed or error)
   * @param {string} errorMessage - Error message if status is error
   * @returns {Promise<Object>} - Result of the operation
   */
  async completeSession(sessionId, status = 'completed', errorMessage = null) {
    try {
      const updateData = {
        status,
        completed_at: new Date().toISOString()
      };
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error completing session:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== RETURNS MANAGEMENT ====================
  
  /**
   * Create a new return
   * @param {Object} returnData - Return data validated with returnSchema
   * @returns {Promise<Object>} - Result of the operation
   */
  async createReturn(returnData) {
    try {
      // Determine which schema to use based on return_type
      let validatedData;
      if (returnData.return_type === 'individual') {
        validatedData = schemas.individualReturnSchema.parse(returnData);
      } else if (returnData.return_type === 'business') {
        validatedData = schemas.businessReturnSchema.parse(returnData);
      } else if (returnData.return_type === 'corporate') {
        validatedData = schemas.corporateReturnSchema.parse(returnData);
      } else {
        throw new Error('Invalid return type');
      }
      
      const { data, error } = await supabase
        .from('returns')
        .insert([{
          session_id: validatedData.session_id,
          pin_id: validatedData.pin_id,
          status: validatedData.status,
          submission_date: validatedData.submission_date,
          return_period: validatedData.return_period,
          return_data: validatedData.return_data
        }])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating return:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get return by ID
   * @param {string} returnId - Return ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getReturnById(returnId) {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('id', returnId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting return:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get returns by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getReturnsByUserId(userId) {
    try {
      const { data: pins, error: pinsError } = await supabase
        .from('pins')
        .select('id')
        .eq('user_id', userId);
      
      if (pinsError) throw pinsError;
      
      if (pins.length === 0) {
        return { success: true, data: [] };
      }
      
      const pinIds = pins.map(pin => pin.id);
      
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .in('pin_id', pinIds);
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting returns:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update return status
   * @param {string} returnId - Return ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateReturnStatus(returnId, status) {
    try {
      const { data, error } = await supabase
        .from('returns')
        .update({ status })
        .eq('id', returnId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating return status:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== TRANSACTION MANAGEMENT ====================
  
  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data validated with transactionSchema
   * @returns {Promise<Object>} - Result of the operation
   */
  async createTransaction(transactionData) {
    try {
      // Validate data using schema
      const validatedData = schemas.transactionSchema.parse(transactionData);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([validatedData])
        .select();
      
      if (error) throw error;
      
      // Update transaction metrics
      await analyticsService.trackTransaction(data[0].amount);
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getTransactionById(transactionId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting transaction:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get transactions by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getTransactionsByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update transaction status
   * @param {string} transactionId - Transaction ID
   * @param {string} status - New status
   * @param {string} mpesaCode - M-Pesa code if payment completed
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateTransactionStatus(transactionId, status, mpesaCode = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (mpesaCode) {
        updateData.mpesa_code = mpesaCode;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== PARTNER MANAGEMENT ====================
  
  /**
   * Create a new partner
   * @param {Object} partnerData - Partner data validated with partnerSchema
   * @returns {Promise<Object>} - Result of the operation
   */
  async createPartner(partnerData) {
    try {
      // Validate data using schema
      const validatedData = schemas.partnerSchema.parse(partnerData);
      
      const { data, error } = await supabase
        .from('partners')
        .insert([validatedData])
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating partner:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get partner by ID
   * @param {string} partnerId - Partner ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getPartnerById(partnerId) {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting partner:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get partner by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result of the operation
   */
  async getPartnerByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting partner:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update partner status
   * @param {string} partnerId - Partner ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Result of the operation
   */
  async updatePartnerStatus(partnerId, status) {
    try {
      const { data, error } = await supabase
        .from('partners')
        .update({ status })
        .eq('id', partnerId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating partner status:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== ADMIN DASHBOARD DATA ====================
  
  /**
   * Get admin dashboard data
   * @returns {Promise<Object>} - Result of the operation with dashboard data
   */
  async getAdminDashboardData() {
    try {
      // Get user metrics
      const { data: userMetrics, error: userMetricsError } = await supabase
        .from('user_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(30);
      
      if (userMetricsError) throw userMetricsError;
      
      // Get transaction metrics
      const { data: transactionMetrics, error: transactionMetricsError } = await supabase
        .from('transaction_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(30);
      
      if (transactionMetricsError) throw transactionMetricsError;
      
      // Get recent returns
      const { data: recentReturns, error: recentReturnsError } = await supabase
        .from('returns')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (recentReturnsError) throw recentReturnsError;
      
      // Format data for dashboard
      const userTrendData = userMetrics.map(metric => ({
        name: new Date(metric.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: metric.total_users
      })).reverse();
      
      const transactionsTrendData = transactionMetrics.map(metric => ({
        name: new Date(metric.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Number(metric.total_amount)
      })).reverse();
      
      // Create overview data
      const overviewData = [
        {
          title: 'Total Users',
          value: userMetrics[0]?.total_users.toLocaleString() || '0',
          icon: 'Users',
          change: 5.2,
          trend: 'positive',
          tooltip: 'Total registered users'
        },
        {
          title: 'Total Transactions',
          value: `KES ${(transactionMetrics[0]?.total_amount || 0).toLocaleString()}`,
          icon: 'CreditCard',
          change: 8.1,
          trend: 'positive',
          tooltip: 'Total transaction value'
        },
        {
          title: 'Returns Filed',
          value: recentReturns.length.toLocaleString(),
          icon: 'FileText',
          change: 12.5,
          trend: 'positive',
          tooltip: 'Total tax returns filed'
        },
        {
          title: 'Avg. Processing Time',
          value: '2.3 days',
          icon: 'Clock',
          change: -5.1,
          trend: 'positive',
          tooltip: 'Average time to process returns'
        }
      ];
      
      return {
        success: true,
        data: {
          overviewData,
          userTrendData,
          transactionsTrendData,
          recentReturns
        }
      };
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new DatabaseService();
