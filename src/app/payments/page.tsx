'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, Badge, Skeleton } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Payment } from '@/types';

export default function PaymentsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('payments').select('*')
        .or(`payer_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (data) setPayments(data as Payment[]);
      setLoading(false);
    };
    fetch();
  }, [user, supabase]);

  const totalEarned = payments.filter((p) => p.recipient_id === user?.id && p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);
  const totalSpent = payments.filter((p) => p.payer_id === user?.id && p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><Skeleton className="h-96" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">Payments</h1>
      <p className="text-surface-500 mb-8">Track your payment history</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <p className="text-sm text-surface-500">Total Earned</p>
          <p className="text-3xl font-bold text-accent-emerald">${totalEarned.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-surface-500">Total Spent</p>
          <p className="text-3xl font-bold text-surface-900">${totalSpent.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-surface-900 mb-4">Transaction History</h2>
        {payments.length === 0 ? (
          <p className="text-surface-500 text-sm py-8 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                <div>
                  <p className="font-medium text-surface-900">
                    {p.payer_id === user?.id ? 'Payment' : 'Earning'}
                  </p>
                  <p className="text-xs text-surface-500">{formatDate(p.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${p.recipient_id === user?.id ? 'text-accent-emerald' : 'text-surface-900'}`}>
                    {p.recipient_id === user?.id ? '+' : '-'}${p.amount.toFixed(2)}
                  </p>
                  <Badge variant={p.status === 'succeeded' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'} className="capitalize text-xs">{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
