'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface UserContextType {
    user: User | null;
    loading: boolean;
    isAdminView: boolean;
    toggleAdminView: () => void;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdminView, setIsAdminView] = useState(false);

    const fetchUserProfile = async (userId: string, email?: string) => {
        try {
            // 1 round-trip só: profile + subscription embutida (antes eram 2
            // queries em série segurando o spinner da tela inteira).
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*, subscriptions(*)')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            if (!profile || !profile.phone) {
                console.warn("UserContext: Perfil sem telefone. Checkout wizard irá capturar.");
            }

            const sub = profile?.subscriptions;
            const entitlement = Array.isArray(sub) ? sub[0] : sub;

            // Mesma regra de subscription/status/route.ts: 'active' E ainda
            // dentro do período pago. Sem o check de valid_until, quem
            // cancelava ou deixava expirar continuava marcado como 'pro' aqui
            // (a EFI não flipa o status sozinha como o Stripe fazia).
            const isActive = !!entitlement &&
                entitlement.status === 'active' &&
                (!entitlement.valid_until || new Date(entitlement.valid_until) > new Date());
            const plan: 'free' | 'pro' = isActive ? 'pro' : 'free';

            const userData: User = {
                id: userId,
                name: profile?.full_name || 'Usuário',
                email: email || profile?.email || '',
                phone: profile?.phone || '',
                is_admin: profile?.is_admin || false,
                coach_personality: profile?.coach_personality || 'gordon_ramsay',
                goal: profile?.goal || null,
                plan: plan,
                plan_valid_until: entitlement?.valid_until,
                plan_cancel_at_period_end: entitlement?.cancel_at_period_end || false
            };

            setUser(userData);
        } catch (error) {
            console.error('UserContext: Erro ao carregar perfil', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        let isFetching = false; // Prevent concurrent deadlocks

        const handleSession = async (session: any) => {
            if (isFetching) return;
            isFetching = true;

            if (session?.user) {
                // Promise.race to guarantee we escape infinite loading if Supabase POST/GET hangs
                const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 8000));
                try {
                    await Promise.race([
                        fetchUserProfile(session.user.id, session.user.email),
                        timeout
                    ]);
                } catch (e) {
                    console.error("UserContext HandleSession Error:", e);
                    if (mounted) setLoading(false);
                } finally {
                    isFetching = false;
                }
            } else {
                setUser(null);
                if (mounted) setLoading(false);
                isFetching = false;
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`UserContext Auth Event: ${event}`);
            if (!mounted) return;

            if (event === 'INITIAL_SESSION') {
                await handleSession(session);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await handleSession(session);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAdminView(false);
                if (mounted) setLoading(false);
                isFetching = false;
            }
        });

        // Fallback for when "INITIAL_SESSION" gets completely skipped by Supabase JS on load
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("UserContext: Falha na sessão inicial", error);
                if (mounted) setLoading(false);
            } else if (session) {
                // If there's a session but events haven't fired or were skipped, gently process it
                handleSession(session);
            } else {
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        // scope: 'local' limpa a sessão local sem depender de chamada de rede
        // ao servidor (que falha com 403 se o token já expirou e deixaria o
        // usuário "preso" logado). try/catch garante o redirect em qualquer caso.
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) {
            console.error('UserContext: erro no signOut', e);
        }
        setUser(null);
        // Limpa caches do Service Worker para não servir páginas autenticadas
        if (typeof window !== 'undefined' && 'caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
            } catch {
                /* ignora falha ao limpar cache */
            }
        }
        window.location.href = '/';
    };

    const toggleAdminView = () => {
        if (user?.is_admin) setIsAdminView(prev => !prev);
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchUserProfile(session.user.id, session.user.email);
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            loading,
            isAdminView,
            toggleAdminView,
            logout,
            refreshProfile
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
