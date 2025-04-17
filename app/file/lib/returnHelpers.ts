// @ts-nocheck
// lib/returnHelpers.ts
import { supabase } from '@/lib/supabaseClient'
import { 
  ManufacturerDetails, 
  FileReturnResponse, 
  PhysicalAddress,
  PostalAddress,
  ContactDetails,
  BusinessDetails,
  FormData,
  FilingStatus 
} from './types'
import SessionManagementService from "@/src/sessionManagementService"
import { v4 as uuidv4 } from 'uuid';

const sessionService = new SessionManagementService();

export const extractManufacturerDetails = async (pin: string) => {
  try {
    // Log the API call attempt in database
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'PIN details extraction attempted',
            metadata: {
              pin: pin
            }
          }]);
          
        console.log('[DB] Recorded PIN details extraction attempt');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record PIN extraction attempt:', dbError);
      }
    }
    
    const response = await fetch('/api/manufacturer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })

    const data = await response.json()
    if (!data.success) {
      // Log the extraction failure
      if (currentSessionId) {
        try {
          await supabase
            .from('session_activities')
            .insert([{
              session_id: currentSessionId,
              activity_type: 'user_action',
              description: 'PIN details extraction failed',
              metadata: {
                pin: pin,
                error: data.error
              }
            }]);
            
          console.log('[DB] Recorded PIN extraction failure');
        } catch (dbError) {
          console.error('[DB ERROR] Failed to record PIN extraction failure:', dbError);
        }
      }
      
      throw new Error(data.error)
    }
    
    // Log the successful extraction
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'PIN details extracted successfully',
            metadata: {
              pin: pin,
              taxpayer_name: data.data.taxpayerName
            }
          }]);
          
        console.log('[DB] Recorded successful PIN extraction');
        
        // Create or update PIN record
        const pinId = uuidv4(); // Generate UUID for pin record
        const { data: pinData, error: pinError } = await supabase
          .from('pins')
          .upsert({
            id: pinId, // Use the generated UUID
            pin_number: pin,
            pin_type: pin.startsWith('A') ? 'A' : 'P',
            is_individual: pin.startsWith('A'),
            owner_name: data.data.taxpayerName,
            owner_email: data.data.mainEmailId,
            business_details: {
              business_reg_certi_no: data.data.businessRegCertiNo,
              busi_reg_dt: data.data.busiRegDt,
              busi_commenced_dt: data.data.busiCommencedDt
            },
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'pin_number', // Upsert based on pin_number to avoid duplicates
            returning: 'representation'
          })
          .select();
          
        if (pinError) {
          console.error('[DB ERROR] Failed to update PIN record:', pinError);
        } else {
          console.log('[DB] Updated PIN record:', pinData);
        }
        
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record successful PIN extraction:', dbError);
      }
    }
    
    return data.data
  } catch (error: any) {
    console.error('Error extracting manufacturer details:', error)
    throw error
  }
}

// Debounce function to prevent excessive API calls
const debounce = <T extends (...args: any[]) => Promise<any>>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

export const validatePassword = async (
  pin: string, 
  password: string,
  setPasswordValidationStatus?: (status: "idle" | "checking" | "invalid" | "valid") => void,
  setPasswordError?: (error: string | null) => void,
  company_name?: string
): Promise<{ isValid: boolean, error?: string }> => {
  try {
    if (setPasswordValidationStatus) {
      setPasswordValidationStatus("checking");
    }
    
    // Log password validation attempt
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'Password validation attempted',
            metadata: {
              pin: pin
            }
          }]);
          
        console.log('[DB] Recorded password validation attempt');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record password validation attempt:', dbError);
      }
    }
    
    // Validate PIN first if company_name is not provided
    if (!company_name) {
      try {
        // Call API to get taxpayer details by PIN
        const pinResponse = await fetch(`/api/company/brs?pin=${encodeURIComponent(pin)}`, {
          method: 'GET'
        });
        
        if (!pinResponse.ok) {
          throw new Error(`PIN validation failed with status ${pinResponse.status}`);
        }
        
        const pinData = await pinResponse.json();
        
        if (pinData.success && pinData.data) {
          company_name = pinData.data.taxpayerName || '';
          console.log(`[PIN Validation] Found taxpayer name: ${company_name}`);
        } else {
          console.error('[PIN Validation] Failed to get taxpayer details:', pinData.message);
        }
      } catch (pinError) {
        console.error('[PIN Validation] Error:', pinError);
      }
    }
    
    // Call the API for password validation
    try {
      const response = await fetch('/api/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: company_name || '', // Company name or individual name
          kra_pin: pin,
          kra_password: password,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (setPasswordValidationStatus) {
          setPasswordValidationStatus("valid");
        }
        if (setPasswordError) {
          setPasswordError(null);
        }
        
        // Log successful validation
        if (currentSessionId) {
          try {
            await supabase
              .from('session_activities')
              .insert([{
                session_id: currentSessionId,
                activity_type: 'user_action',
                description: 'Password validated successfully',
                metadata: {
                  pin: pin,
                  status: data.status,
                  timestamp: data.timestamp
                }
              }]);
              
            console.log('[DB] Recorded successful password validation');
            
            // Update session with password validation
            await supabase
              .from('sessions')
              .update({
                form_data: {
                  pin: pin,
                  password: password,
                  passwordValidated: true,
                  company_name: data.company_name || company_name || ''
                }
              })
              .eq('id', currentSessionId);
              
            console.log('[DB] Updated session with password validation');
          } catch (dbError) {
            console.error('[DB ERROR] Failed to record successful password validation:', dbError);
          }
        }
        
        return { isValid: true };
      } else {
        if (setPasswordValidationStatus) {
          setPasswordValidationStatus("invalid");
        }
        if (setPasswordError) {
          setPasswordError(data.message || "Please enter the correct password.");
        }
        
        // Log failed validation
        if (currentSessionId) {
          try {
            await supabase
              .from('session_activities')
              .insert([{
                session_id: currentSessionId,
                activity_type: 'user_action',
                description: 'Password validation failed',
                metadata: {
                  pin: pin,
                  message: data.message,
                  status: data.status
                }
              }]);
              
            console.log('[DB] Recorded failed password validation');
          } catch (dbError) {
            console.error('[DB ERROR] Failed to record failed password validation:', dbError);
          }
        }
        
        return { isValid: false, error: data.message };
      }
    } catch (apiError) {
      console.error('API error during password validation:', apiError);
      throw apiError;
    }
  } catch (error) {
    if (setPasswordValidationStatus) {
      setPasswordValidationStatus("invalid");
    }
    if (setPasswordError) {
      setPasswordError("Failed to validate password. Please try again.");
    }
    
    // Log validation error
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'Password validation error',
            metadata: {
              pin: pin,
              error: error.message
            }
          }]);
          
        console.log('[DB] Recorded password validation error');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record password validation error:', dbError);
      }
    }
    
    return { isValid: false, error: error.message };
  }
};

// Create a debounced version of the password validation function
export const debouncedValidatePassword = (
  pin: string,
  password: string,
  setPasswordValidationStatus?: (status: "idle" | "checking" | "invalid" | "valid") => void,
  setPasswordError?: (error: string | null) => void,
  company_name?: string
) => {
  // Set status to checking immediately
  if (setPasswordValidationStatus) {
    setPasswordValidationStatus("checking");
  }
  
  // Return a promise that will resolve with the validation result
  return new Promise<{ isValid: boolean, error?: string }>((resolve) => {
    const debouncedValidation = debounce(async () => {
      try {
        const result = await validatePassword(pin, password, setPasswordValidationStatus, setPasswordError, company_name);
        resolve(result);
      } catch (error) {
        console.error('Debounced validation error:', error);
        resolve({ isValid: false, error: error.message });
      }
    }, 3000); // 3 second debounce
    
    debouncedValidation();
  });
};

export const fileNilReturn = async (credentials: { 
  pin: string; 
  password: string 
}): Promise<FileReturnResponse> => {
  try {
    // Log filing attempt
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'return_submitted',
            description: 'Return filing initiated',
            metadata: {
              pin: credentials.pin
            }
          }]);
          
        console.log('[DB] Recorded return filing initiation');
        
        // Update session status
        await supabase
          .from('sessions')
          .update({
            form_data: {
              pin: credentials.pin,
              password: credentials.password,
              filing_initiated_at: new Date().toISOString()
            }
          })
          .eq('id', currentSessionId);
          
        console.log('[DB] Updated session with filing initiation');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record filing initiation:', dbError);
      }
    }
    
    // Simulate filing process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate receipt number
    const receiptNumber = `NR${Math.random().toString().slice(2, 10)}`;
    
    // Log successful filing
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'return_completed',
            description: 'Return filed successfully',
            metadata: {
              pin: credentials.pin,
              receipt_number: receiptNumber
            }
          }]);
          
        console.log('[DB] Recorded successful filing');
        
        // First, find or create the PIN record to get the UUID
        let pinIdUuid;
        
        // Check if a pin record exists
        const { data: existingPin, error: pinQueryError } = await supabase
          .from('pins')
          .select('id')
          .eq('pin_number', credentials.pin)
          .maybeSingle(); // Use maybeSingle to avoid errors when no rows found
          
        if (pinQueryError && pinQueryError.code !== 'PGRST116') {
          throw pinQueryError;
        }
        
        if (existingPin) {
          // Use the existing pin's UUID
          pinIdUuid = existingPin.id;
          console.log('[DB] Found existing pin record with ID:', pinIdUuid);
        } else {
          // Create a new pin record
          const pinId = uuidv4(); // Generate UUID for pin
          console.log('[DB] Creating new pin record with ID:', pinId);
          const { data: newPin, error: insertError } = await supabase
            .from('pins')
            .insert([{
              id: pinId,
              pin_number: credentials.pin,
              pin_type: credentials.pin.startsWith('A') ? 'A' : 'P',
              is_individual: credentials.pin.startsWith('A'),
              owner_name: 'Unknown',
              owner_email: null
            }])
            .select()
            .single();
            
          if (insertError) {
            console.error('[DB ERROR] Failed to create pin record:', insertError);
            throw insertError;
          }
          
          pinIdUuid = newPin.id;
          console.log('[DB] Created new pin record with ID:', pinIdUuid);
        }
        
        // Create return record with the correct UUID
        const returnId = uuidv4(); // Generate UUID for return
        const { data: returnData, error: returnError } = await supabase
          .from('returns')
          .insert([{
            id: returnId,
            session_id: currentSessionId,
            pin_id: pinIdUuid, // Use the UUID instead of PIN string
            return_type: 'individual',
            is_nil_return: true,
            status: 'completed',
            completed_at: new Date().toISOString(),
            acknowledgment_number: receiptNumber,
            payment_status: 'paid',
            return_data: {
              pin: credentials.pin,
              filing_date: new Date().toISOString()
            }
          }])
          .select();
          
        if (returnError) {
          console.error('[DB ERROR] Failed to create return record:', returnError);
        } else {
          console.log('[DB] Created return record:', returnData);
          
          // Create return history record
          const historyId = uuidv4(); // Generate UUID for history
          const { error: historyError } = await supabase
            .from('return_history')
            .insert([{
              id: historyId,
              return_id: returnData[0].id,
              action: 'created',
              description: 'Nil return filed',
              performed_by_email: null,
              performed_by_name: null,
              metadata: {
                pin: credentials.pin,
                session_id: currentSessionId,
                receipt_number: receiptNumber
              }
            }]);
            
          if (historyError) {
            console.error('[DB ERROR] Failed to create return history record:', historyError);
          } else {
            console.log('[DB] Created return history record');
          }
        }
        
        // Update session as completed
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            form_data: {
              pin: credentials.pin,
              password: credentials.password,
              receipt_number: receiptNumber,
              filing_completed_at: new Date().toISOString()
            }
          })
          .eq('id', currentSessionId);
          
        console.log('[DB] Updated session as completed');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record successful filing:', dbError);
      }
    }
    
    return {
      status: "success",
      message: "Return filed successfully",
      receiptNumber: receiptNumber
    };
  } catch (error) {
    console.error('Error filing nil return:', error);
    
    // Log filing error
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'session_error',
            description: 'Return filing failed',
            metadata: {
              pin: credentials.pin,
              error: error.message
            }
          }]);
          
        console.log('[DB] Recorded filing error');
        
        // Update session with error
        await supabase
          .from('sessions')
          .update({
            status: 'error',
            error_message: error.message,
            form_data: {
              pin: credentials.pin,
              password: credentials.password,
              filing_error: error.message,
              filing_error_at: new Date().toISOString()
            }
          })
          .eq('id', currentSessionId);
          
        console.log('[DB] Updated session with error');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record filing error:', dbError);
      }
    }
    
    return { status: "error", message: (error as Error).message };
  }
}

export const recoverPin = async (pin: string): Promise<boolean> => {
  try {
    // Log recovery attempt
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'PIN recovery requested',
            metadata: {
              pin: pin
            }
          }]);
          
        console.log('[DB] Recorded PIN recovery request');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record PIN recovery request:', dbError);
      }
    }
    
    const response = await fetch('/api/recover/pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })
    
    const data = await response.json()
    
    // Log recovery result
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: data.success ? 'PIN recovery initiated successfully' : 'PIN recovery failed',
            metadata: {
              pin: pin,
              success: data.success,
              message: data.message
            }
          }]);
          
        console.log('[DB] Recorded PIN recovery result');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record PIN recovery result:', dbError);
      }
    }
    
    return data.success;
  } catch (error) {
    console.error('Error initiating PIN recovery:', error);
    
    // Log recovery error
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'PIN recovery error',
            metadata: {
              pin: pin,
              error: error.message
            }
          }]);
          
        console.log('[DB] Recorded PIN recovery error');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record PIN recovery error:', dbError);
      }
    }
    
    return false;
  }
}

export const resetPassword = async (pin: string): Promise<boolean> => {
  try {
    // Log reset attempt
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'Password reset requested',
            metadata: {
              pin: pin
            }
          }]);
          
        console.log('[DB] Recorded password reset request');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record password reset request:', dbError);
      }
    }
    
    const response = await fetch('/api/reset/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })
    
    const data = await response.json()
    
    // Log reset result
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: data.success ? 'Password reset initiated successfully' : 'Password reset failed',
            metadata: {
              pin: pin,
              success: data.success,
              message: data.message
            }
          }]);
          
        console.log('[DB] Recorded password reset result');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record password reset result:', dbError);
      }
    }
    
    return data.success;
  } catch (error) {
    console.error('Error initiating password reset:', error);
    
    // Log reset error
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'Password reset error',
            metadata: {
              pin: pin,
              error: error.message
            }
          }]);
          
        console.log('[DB] Recorded password reset error');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record password reset error:', dbError);
      }
    }
    
    return false;
  }
}

const resetEmailAndPassword = async (pin: string): Promise<boolean> => {
  try {
    // Log reset attempt
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'Email and password reset requested',
            metadata: {
              pin: pin
            }
          }]);
          
        console.log('[DB] Recorded email and password reset request');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record email and password reset request:', dbError);
      }
    }
    
    const response = await fetch('/api/reset/email-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })

    const data = await response.json()
    
    // Log reset result
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: data.success ? 'Email and password reset initiated successfully' : 'Email and password reset failed',
            metadata: {
              pin: pin,
              success: data.success,
              message: data.message
            }
          }]);
          
        console.log('[DB] Recorded email and password reset result');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record email and password reset result:', dbError);
      }
    }
    
    return data.success;
  } catch (error) {
    console.error('Error resetting email and password:', error);
    
    // Log reset error
    const currentSessionId = sessionService.getData('currentSessionId');
    if (currentSessionId) {
      try {
        await supabase
          .from('session_activities')
          .insert([{
            session_id: currentSessionId,
            activity_type: 'user_action',
            description: 'Email and password reset error',
            metadata: {
              pin: pin,
              error: error.message
            }
          }]);
          
        console.log('[DB] Recorded email and password reset error');
      } catch (dbError) {
        console.error('[DB ERROR] Failed to record email and password reset error:', dbError);
      }
    }
    
    return false;
  }
}

export { resetEmailAndPassword };
export const resetPasswordAndEmail = resetEmailAndPassword;

export const validatePIN = (pin: string): { isValid: boolean; error: string | null } => {
  if (!pin?.trim()) {
    return { isValid: false, error: 'PIN is required' };
  }

  pin = pin.toUpperCase().trim();

  // First check the starting letter before length
  if (!pin.startsWith('A') && !pin.startsWith('P')) {
    return { 
      isValid: false, 
      error: 'PIN must start with A (Individual) or P (Business)'
    };
  }

  if (pin.length !== 11) {
    return { isValid: false, error: 'PIN must be exactly 11 characters' };
  }

  const middleDigits = pin.substring(1, 10);
  if (!/^\d{9}$/.test(middleDigits)) {
    return { 
      isValid: false, 
      error: 'PIN must have exactly 9 digits after A/P and before final letter'
    };
  }

  const lastChar = pin.charAt(10);
  if (!/^[A-Z]$/.test(lastChar)) {
    return {
      isValid: false,
      error: 'PIN must end with a letter A-Z'
    };
  }

  return { isValid: true, error: null };
};