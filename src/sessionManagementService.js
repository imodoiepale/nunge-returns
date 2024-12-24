// Session Management Service

import { supabase } from '../lib/supabaseClient';

class SessionManagementService {
    constructor(storageType = 'sessionStorage') {
        if (typeof window !== 'undefined') {
            this.storage = window[storageType];
        } else {
            this.storage = null;
        }
    }

    // Create a new session ID for each unique PIN
    async createSession(pin, userId = null) {
        const { data, error } = await supabase
            .from('sessions')
            .insert([{ pin, user_id: userId, status: 'active', current_step: 1 }])
            .select();

        if (error) throw error;
        return data[0].id;
    }

    // Update session data
    async updateSession(sessionId, updates) {
        const { error } = await supabase
            .from('sessions')
            .update(updates)
            .eq('id', sessionId);

        if (error) throw error;
    }

    // Complete session
    async completeSession(sessionId) {
        const { error } = await supabase
            .from('sessions')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) throw error;
    }

    // Save data to storage
    saveData(key, data) {
        this.storage.setItem(key, JSON.stringify(data));
    }

    // Retrieve data from storage
    getData(key) {
        if (!this.storage) return null;
        const data = this.storage.getItem(key);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn(`Error parsing data for key ${key}:`, e);
            return null;
        }
    }

    // Remove data from storage
    removeData(key) {
        this.storage.removeItem(key);
    }

    // Clear all session data
    clearAllData() {
        this.storage.clear();
    }

    // Cleanup session data from Supabase
    async cleanupSession(sessionId) {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);

        if (!error) {
            // Decrement the user count
            // Assuming userCount is managed in a higher scope or context
            setUserCount(prevCount => prevCount - 1);
        } else {
            throw error;
        }
    }

    // Handle back button navigation
    handleBackButton() {
        if (typeof window !== 'undefined') {
            window.onpopstate = (event) => {
                if (event.state) {
                    // Restore state from session storage
                    this.restoreState(event.state);
                }
            };
        }
    }

    // Restore state from session storage
    restoreState(state) {
        if (state.formData) {
            for (const [key, value] of Object.entries(state.formData)) {
                this.saveData(key, value);
            }
        }
    }
}

export default SessionManagementService;