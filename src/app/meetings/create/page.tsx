'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Card, Select, Toggle, Badge } from '@/components/ui';
import type { AgendaItem } from '@/types';

export default function CreateMeetingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', meeting_type: 'online' as const, format: 'one_on_one' as const,
    location: '', meeting_link: '', duration_minutes: 60, max_participants: 1,
    price: 0, currency: 'USD', is_free: true, tags: [] as string[],
  });
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaDuration, setAgendaDuration] = useState(15);
  const [tagInput, setTagInput] = useState('');
  const [slots, setSlots] = useState<{ date: string; time: string }[]>([]);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: meeting, error } = await supabase.from('meetings').insert({
      ...form, agenda, mentor_id: user.id, is_active: true,
    }).select().single();

    if (error || !meeting) { alert('Error creating meeting'); setLoading(false); return; }

    // Create slots
    if (slots.length > 0) {
      const slotRecords = slots.map((s) => {
        const start = new Date(`${s.date}T${s.time}`);
        const end = new Date(start.getTime() + form.duration_minutes * 60000);
        return {
          meeting_id: meeting.id, start_time: start.toISOString(), end_time: end.toISOString(),
          spots_available: form.format === 'group' ? form.max_participants : 1,
        };
      });
      await supabase.from('meeting_slots').insert(slotRecords);
    }

    router.push(`/meetings/${meeting.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">Create Meeting</h1>
      <p className="text-surface-500 mb-8">Set up a new mentoring session for mentees to book.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="!p-8 space-y-4">
          <h2 className="font-semibold text-surface-900 text-lg">Basic Info</h2>
          <Input label="Title" placeholder="e.g. System Design Interview Prep" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Description" rows={4} placeholder="What will mentees learn?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={[{ value: 'online', label: '🌐 Online' }, { value: 'offline', label: '📍 Offline' }, { value: 'hybrid', label: '🔄 Hybrid' }]}
              value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value as 'online' | 'offline' | 'hybrid' })} />
            <Select label="Format" options={[{ value: 'one_on_one', label: '👤 1-on-1' }, { value: 'group', label: '👥 Group' }]}
              value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as 'one_on_one' | 'group', max_participants: e.target.value === 'group' ? 10 : 1 })} />
          </div>
          {form.meeting_type !== 'offline' && <Input label="Meeting Link" placeholder="https://zoom.us/j/..." value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} />}
          {form.meeting_type !== 'online' && <Input label="Location" placeholder="123 Main St, City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (min)" type="number" min={15} max={480} step={15} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            {form.format === 'group' && <Input label="Max Participants" type="number" min={2} max={100} value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} />}
          </div>
        </Card>

        <Card className="!p-8 space-y-4">
          <h2 className="font-semibold text-surface-900 text-lg">Pricing</h2>
          <Toggle checked={form.is_free} onChange={(v) => setForm({ ...form, is_free: v, price: v ? 0 : form.price })} label="Free session" />
          {!form.is_free && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price" type="number" min={1} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <Select label="Currency" options={['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'].map((c) => ({ value: c, label: c }))} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          )}
        </Card>

        <Card className="!p-8 space-y-4">
          <h2 className="font-semibold text-surface-900 text-lg">Agenda</h2>
          {agenda.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-surface-500">{item.duration_minutes} min</p></div>
              <button onClick={() => setAgenda(agenda.filter((_, j) => j !== i))} className="text-accent-rose text-xs">Remove</button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Agenda item title" value={agendaTitle} onChange={(e) => setAgendaTitle(e.target.value)} className="flex-1" />
            <Input type="number" placeholder="Min" min={5} value={agendaDuration} onChange={(e) => setAgendaDuration(Number(e.target.value))} className="w-20" />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (agendaTitle) { setAgenda([...agenda, { title: agendaTitle, duration_minutes: agendaDuration }]); setAgendaTitle(''); } }}>Add</Button>
          </div>
        </Card>

        <Card className="!p-8 space-y-4">
          <h2 className="font-semibold text-surface-900 text-lg">Time Slots</h2>
          <p className="text-sm text-surface-500">Add available time slots for this meeting.</p>
          {slots.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <span className="text-sm font-medium">{s.date} at {s.time}</span>
              <button onClick={() => setSlots(slots.filter((_, j) => j !== i))} className="text-accent-rose text-xs">Remove</button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            <Input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (slotDate && slotTime) { setSlots([...slots, { date: slotDate, time: slotTime }]); } }}>Add Slot</Button>
          </div>
        </Card>

        <Card className="!p-8 space-y-4">
          <h2 className="font-semibold text-surface-900 text-lg">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <Badge key={tag} variant="brand" className="cursor-pointer" onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}>{tag} ×</Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && tagInput) { e.preventDefault(); setForm({ ...form, tags: [...form.tags, tagInput] }); setTagInput(''); } }} />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={loading} size="lg">Create Meeting</Button>
        </div>
      </form>
    </div>
  );
}
