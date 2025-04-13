// src/sessionManagementService.ts
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';

class SessionManagementService {
  private storage: Storage | null = null;
  private prefix = 'tax_filing_';

  constructor() {
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
    }
  }

  // Save data to storage
  saveData(key: string, data: any): void {
    if (!this.storage) return;
    this.storage.setItem(`${this.prefix}${key}`, JSON.stringify(data));
  }

  // Get data from storage
  getData(key: string): any {
    if (!this.storage) return null;
    const item = this.storage.getItem(`${this.prefix}${key}`);
    try {
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return item;
    }
  }

  // Remove data from storage
  removeData(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(`${this.prefix}${key}`);
  }

  // Clear all session data
  clearAllData(): void {
    if (!this.storage) return;
    
    Object.keys(this.storage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage?.removeItem(key);
      }
    });
  }

  // Create a new prospect session in the database
  async createProspectSession(): Promise<string> {
    try {
      // Check if we already have a session ID
      const existingSessionId = this.getData('currentSessionId');
      if (existingSessionId) {
        console.log('[SESSION] Using existing session ID:', existingSessionId);
        
        // Check if session exists in database
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', existingSessionId)
          .single();
          
        if (!error && data) {
          // Update last activity
          await supabase
            .from('sessions')
            .update({
              last_activity: new Date().toISOString()
            })
            .eq('id', existingSessionId);
            
          return existingSessionId;
        }
        
        // If session doesn't exist in database, remove from storage
        this.removeData('currentSessionId');
      }
      
      // Create new session
      const sessionId = uuidv4();
      const deviceInfo = this.getDeviceInfo();
      
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          id: sessionId,
          status: 'prospect',
          current_step: 1,
          device_info: deviceInfo,
          ip_address: await this.getIPAddress(),
          user_agent: navigator.userAgent,
          is_mobile: this.isMobileDevice(),
          form_data: {
            started_at: new Date().toISOString()
          }
        }])
        .select()
        .single();
        
      if (error) {
        console.error('[SESSION ERROR] Failed to create session:', error);
        throw error;
      }
      
      this.saveData('currentSessionId', sessionId);
      return sessionId;
    } catch (error) {
      console.error('[SESSION ERROR] Error creating prospect session:', error);
      throw error;
    }
  }

  // Create a new session with a PIN
  async createSession(pin: string, data: any = {}): Promise<string> {
    try {
      const sessionId = uuidv4();
      const deviceInfo = this.getDeviceInfo();
      
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .insert([{
          id: sessionId,
          pin: pin,
          status: 'active',
          current_step: 1,
          device_info: deviceInfo,
          ip_address: await this.getIPAddress(),
          user_agent: navigator.userAgent,
          is_mobile: this.isMobileDevice(),
          form_data: {
            pin: pin,
            started_at: new Date().toISOString(),
            ...data
          }
        }])
        .select()
        .single();
        
      if (error) {
        console.error('[SESSION ERROR] Failed to create session:', error);
        throw error;
      }
      
      this.saveData('currentSessionId', sessionId);
      return sessionId;
    } catch (error) {
      console.error('[SESSION ERROR] Error creating session:', error);
      throw error;
    }
  }

  // Update an existing session
  async updateSession(sessionId: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await supabase
        .from('sessions')
        .update({
          ...data,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select();
        
      if (error) {
        console.error('[SESSION ERROR] Failed to update session:', error);
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error('[SESSION ERROR] Error updating session:', error);
      throw error;
    }
  }

  // Mark a session as completed
  async completeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('[SESSION ERROR] Failed to complete session:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SESSION ERROR] Error completing session:', error);
      throw error;
    }
  }

  // Check for existing sessions with PIN
  async handlePinChange(pin: string): Promise<any> {
    try {
      // Check for active sessions with this PIN
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('pin', pin)
        .eq('status', 'active')
        .order('last_activity', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('[SESSION ERROR] Failed to check for existing sessions:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('[SESSION ERROR] Error checking for existing sessions:', error);
      return null;
    }
  }

  // Helper methods
  private getDeviceInfo(): any {
    return {
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      browser: this.getBrowser(),
      os: this.getOS()
    };
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf("Firefox") > -1) {
      return "Firefox";
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
      return "Samsung Browser";
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
      return "Opera";
    } else if (userAgent.indexOf("Trident") > -1) {
      return "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      return "Edge";
    } else if (userAgent.indexOf("Chrome") > -1) {
      return "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      return "Safari";
    } else {
      return "Unknown";
    }
  }

  private getOS(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf("Win") > -1) {
      return "Windows";
    } else if (userAgent.indexOf("Mac") > -1) {
      return "MacOS";
    } else if (userAgent.indexOf("Linux") > -1) {
      return "Linux";
    } else if (userAgent.indexOf("Android") > -1) {
      return "Android";
    } else if (userAgent.indexOf("like Mac") > -1) {
      return "iOS";
    } else {
      return "Unknown";
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('[SESSION] Error getting IP address:', error);
      return 'unknown';
    }
  }
}

export default SessionManagementService;