'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Meeting, MeetingSlot } from '@/types';

export function useMeetings(mentorId?: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('meetings')
      .select('*, mentor:profiles(*), slots:meeting_slots(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (mentorId) query = query.eq('mentor_id', mentorId);

    const { data, error } = await query;
    if (!error && data) setMeetings(data as Meeting[]);
    setLoading(false);
  }, [supabase, mentorId]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  return { meetings, loading, refetch: fetchMeetings };
}

export function useMeeting(meetingId: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('*, mentor:profiles(*)')
        .eq('id', meetingId)
        .single();

      const { data: slotsData } = await supabase
        .from('meeting_slots')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('is_available', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time');

      if (meetingData) setMeeting(meetingData as Meeting);
      if (slotsData) setSlots(slotsData as MeetingSlot[]);
      setLoading(false);
    };
    fetch();
  }, [supabase, meetingId]);

  return { meeting, slots, loading };
}
