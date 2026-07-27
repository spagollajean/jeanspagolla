export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    plan: 'free' | 'pro';
    avatar?: string;
    plan_valid_until?: string;
    plan_cancel_at_period_end?: boolean;
    is_admin?: boolean;
    coach_personality?: string;
    goal?: 'emagrecer' | 'ganhar_massa' | 'manter' | null;
}
