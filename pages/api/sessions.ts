// pages/api/sessions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pin } = req.body;

        const { data, error } = await supabase
            .from('sessions')
            .insert({
                pin,
                status: 'active',
                current_step: 1
            })
            .select('id, user_number')
            .single();

        if (error) throw error;

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ error: 'Failed to create session' });
    }
}