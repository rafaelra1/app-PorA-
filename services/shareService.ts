import { supabase } from '../lib/supabase';
import { UserProfile } from '../contexts/AuthContext';

export interface TripMember {
    id: string;
    trip_id: string;
    user_id?: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'rejected';
    invited_by: string;
    name?: string; // Hydrated from user profile if available
    avatar?: string; // Hydrated from user profile if available
    initials?: string;
}

export const shareService = {
    /**
     * Get all members for a trip
     */
    async getTripMembers(tripId: string): Promise<TripMember[]> {
        const { data, error } = await supabase
            .from('trip_members')
            .select(`
                *,
                invited_by_user:invited_by (
                    id,
                    raw_user_meta_data
                ),
                user:user_id (
                    id,
                    raw_user_meta_data,
                    email
                )
            `)
            .eq('trip_id', tripId);

        if (error) throw error;

        // Transform data to include user details
        return data.map((member: any) => {
            const userData = member.user?.raw_user_meta_data || {};
            const invitedData = member.invited_by_user?.raw_user_meta_data || {};

            return {
                ...member,
                name: member.user_id ? (userData.full_name || userData.name || member.user?.email) : member.email.split('@')[0],
                avatar: userData.avatar_url,
                initials: (member.email || '').slice(0, 2).toUpperCase()
            };
        });
    },

    /**
     * Invite a user to a trip by email
     */
    async inviteMember(tripId: string, email: string, role: 'editor' | 'viewer' = 'viewer'): Promise<TripMember> {
        // 1. Check if user already exists in auth.users to link immediately (optimization)
        // Note: We can't query auth.users directly from client usually due to security.
        // We will just insert with email. A trigger on DB side could auto-link, 
        // or we handle "accept invite" logic when they log in.

        // For this version, we simple insert.
        const { data, error } = await supabase
            .from('trip_members')
            .insert({
                trip_id: tripId,
                email: email.toLowerCase().trim(),
                role,
                status: 'pending',
                invited_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new Error('Este usuário já foi convidado.');
            throw error;
        }

        return data;
    },

    /**
     * Remove a member or cancel an invite
     */
    async removeMember(memberId: string): Promise<void> {
        const { error } = await supabase
            .from('trip_members')
            .delete()
            .eq('id', memberId);

        if (error) throw error;
    },

    /**
     * Update a member's role
     */
    async updateMemberRole(memberId: string, role: 'editor' | 'viewer'): Promise<void> {
        const { error } = await supabase
            .from('trip_members')
            .update({ role })
            .eq('id', memberId);

        if (error) throw error;
    },

    /**
     * Update trip privacy (public/private)
     */
    async updateTripPrivacy(tripId: string, isPublic: boolean): Promise<void> {
        const { error } = await supabase
            .from('trips')
            .update({ is_public: isPublic })
            .eq('id', tripId);

        if (error) throw error;
    }
};
