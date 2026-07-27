'use client';

import React from 'react';
import Dashboard from '@/views/Dashboard';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, logout, toggleAdminView, refreshProfile } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  // PAYWALL: redireciona para o checkout se não tiver plano ativo. A confirmação
  // pós-pagamento acontece na própria tela de checkout (refreshProfile antes do
  // redirect), então aqui não precisa de polling.
  if (user.plan === 'free') {
    if (typeof window !== 'undefined') {
      router.replace('/checkout');
    }
    return null;
  }

  return (
    <Dashboard
      user={user}
      onLogout={logout}
      onOpenAdmin={user.is_admin ? toggleAdminView : undefined}
      initialTab="overview"
      refreshProfile={refreshProfile}
    />
  );
}
