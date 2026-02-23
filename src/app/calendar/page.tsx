'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, Button, Badge, Select, Input } from '@/components/ui';
import { getDayName } from '@/lib/utils';
import type { Availability, Booking } from '@/types';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

export default function CalendarPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const isMentor = profile?.role === 'mentor' || profile?.role === 'both';

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [availRes, bookingsRes] = await Promise.all([
        supabase.from('availability').select('*').eq('mentor_id', user.id).order('day_of_week'),
        supabase.from('bookings').select('*, meeting:meetings(*), slot:meeting_slots(*)')
          .or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`)
          .eq('status', 'confirmed'),
      ]);
      if (availRes.data) setAvailability(availRes.data as Availability[]);
      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
      setLoading(false);
    };
    fetch();
  }, [user, supabase]);

  const addAvailability = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('availability').insert({
      mentor_id: user.id, day_of_week: newDay, start_time: newStart, end_time: newEnd,
    }).select().single();
    if (data) setAvailability([...availability, data as Availability]);
  };

  const removeAvailability = async (id: string) => {
    await supabase.from('availability').delete().eq('id', id);
    setAvailability(availability.filter((a) => a.id !== id));
  };

  const getWeekDates = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Calendar</h1>
          <p className="text-surface-500">Manage your availability and view bookings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d); }}>← Prev</Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(new Date())}>Today</Button>
          <Button variant="ghost" size="sm" onClick={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d); }}>Next →</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Weekly Calendar View */}
        <div className="lg:col-span-3">
          <Card className="!p-0 overflow-hidden">
            <div className="grid grid-cols-8 border-b border-surface-100">
              <div className="p-3 text-xs font-medium text-surface-400 text-center border-r border-surface-100">Time</div>
              {weekDates.map((date, i) => (
                <div key={i} className={`p-3 text-center border-r border-surface-100 last:border-r-0 ${date.toDateString() === new Date().toDateString() ? 'bg-brand-50' : ''}`}>
                  <p className="text-xs text-surface-400">{getDayName(i).slice(0, 3)}</p>
                  <p className={`text-sm font-semibold ${date.toDateString() === new Date().toDateString() ? 'text-brand-600' : 'text-surface-700'}`}>{date.getDate()}</p>
                </div>
              ))}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-surface-50 min-h-[48px]">
                  <div className="p-2 text-xs text-surface-400 text-right pr-3 border-r border-surface-100">{hour}</div>
                  {DAYS.map((day) => {
                    const hasAvail = availability.some((a) => a.day_of_week === day && a.start_time <= hour && a.end_time > hour);
                    const dayBookings = bookings.filter((b) => {
                      if (!b.slot?.start_time) return false;
                      const slotDate = new Date(b.slot.start_time);
                      return slotDate.getDay() === day && slotDate.getHours() === parseInt(hour);
                    });
                    return (
                      <div key={day} className={`border-r border-surface-50 last:border-r-0 p-0.5 ${hasAvail ? 'bg-brand-50/50' : ''}`}>
                        {dayBookings.map((b) => (
                          <div key={b.id} className="bg-brand-500 text-white text-xs rounded px-1 py-0.5 truncate">
                            {b.meeting?.title || 'Booking'}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Availability Manager */}
        <div className="space-y-4">
          {isMentor && (
            <Card>
              <h3 className="font-semibold text-surface-900 mb-4">Set Availability</h3>
              <div className="space-y-3">
                <Select label="Day" options={DAYS.map((d) => ({ value: d.toString(), label: getDayName(d) }))}
                  value={newDay.toString()} onChange={(e) => setNewDay(Number(e.target.value))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="From" type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
                  <Input label="To" type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
                </div>
                <Button className="w-full" onClick={addAvailability}>Add Slot</Button>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-surface-900 mb-4">Weekly Availability</h3>
            {availability.length === 0 ? (
              <p className="text-sm text-surface-500">No availability set</p>
            ) : (
              <div className="space-y-2">
                {availability.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-surface-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{getDayName(a.day_of_week)}</p>
                      <p className="text-xs text-surface-500">{a.start_time} - {a.end_time}</p>
                    </div>
                    <button onClick={() => removeAvailability(a.id)} className="text-xs text-accent-rose">×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
