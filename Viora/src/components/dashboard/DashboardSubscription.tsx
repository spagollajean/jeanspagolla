'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { 
  BrainCircuit, 
  Heart, 
  ActivitySquare, 
  Crosshair, 
  Flame, 
  Dumbbell, 
  Smile,
  MessageSquare,
  User as UserIcon,
  Phone,
  CheckCircle2,
  Loader2,
  Save,
  Target,
  Apple
} from 'lucide-react';

const GOALS = [
  { id: 'emagrecer', name: 'Emagrecer', icon: <Flame size={24} className="text-red-500" />, desc: 'Perder gordura. Análises, dieta e treino focados em déficit calórico.' },
  { id: 'ganhar_massa', name: 'Ganhar Massa', icon: <Dumbbell size={24} className="text-indigo-500" />, desc: 'Hipertrofia. Foco em proteína, superávit limpo e treino de força.' },
  { id: 'manter', name: 'Comer Melhor', icon: <Apple size={24} className="text-emerald-500" />, desc: 'Equilíbrio e saúde. Qualidade nutricional sem radicalismo.' }
];

const PERSONALITIES = [
  { id: 'gordon_ramsay', name: 'Cheff Titã', icon: <Flame size={24} className="text-orange-500" />, desc: 'Rigoroso, irônico e sem paciência para desculpas.' },
  { id: 'vovo', name: 'Vovó Carinhosa', icon: <Heart size={24} className="text-pink-500" />, desc: 'Super doce. Te chama de neto e incentiva com amor.' },
  { id: 'cientifico', name: 'Dr. Científico', icon: <ActivitySquare size={24} className="text-blue-500" />, desc: '100% Ciência. Foco em macros, termogênese e índices.' },
  { id: 'militar', name: 'Sargento', icon: <Crosshair size={24} className="text-green-600" />, desc: 'Estilo BOPE. Disciplina extrema e ordem absoluta.' },
  { id: 'maromba', name: 'Parceiro Maromba', icon: <Dumbbell size={24} className="text-amber-500" />, desc: 'Monstro da academia. Gírias de treino, alta energia ("Bora crescer!").' },
  { id: 'nutri_gentil', name: 'Nutri Empática', icon: <Smile size={24} className="text-teal-500" />, desc: 'Foco no bem-estar, equilíbrio e reeducação sem radicalismo.' },
  { id: 'ironico', name: 'Robô Sarcástico', icon: <MessageSquare size={24} className="text-purple-500" />, desc: 'Humor ácido, comentários sarcásticos e piadas inteligentes sobre a dieta.' }
];

export default function DashboardSubscription({ user }: { user: any }) {
  const { refreshProfile } = useUser();
  const [selectedPersonality, setSelectedPersonality] = useState(user?.coach_personality || 'gordon_ramsay');
  const [isSavingPersonality, setIsSavingPersonality] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(user?.goal || '');
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Estados do formulário de dados cadastrais
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedPersonality(user.coach_personality || 'gordon_ramsay');
      setSelectedGoal(user.goal || '');
      setFullName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleGoalChange = async (id: string) => {
    setSelectedGoal(id);
    setIsSavingGoal(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ goal: id })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Meta atualizada! Suas próximas análises já vão considerar isso.');
      await refreshProfile();
    } catch (error) {
      toast.error('Erro ao salvar meta.');
      console.error(error);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handlePersonalityChange = async (id: string) => {
    setSelectedPersonality(id);
    setIsSavingPersonality(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ coach_personality: id })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success('Personalidade da IA atualizada com sucesso!');
      await refreshProfile();
    } catch (error) {
      toast.error('Erro ao salvar personalidade.');
      console.error(error);
    } finally {
      setIsSavingPersonality(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      // Limpar formatação de telefone antes de salvar
      const cleanPhone = phone.replace(/[^\d+]/g, '');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          phone: cleanPhone 
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Dados cadastrais atualizados com sucesso!');
      await refreshProfile();
    } catch (error: any) {
      toast.error('Erro ao atualizar dados: ' + (error.message || 'Erro inesperado'));
      console.error(error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans space-y-8">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-500 text-sm">Personalize o comportamento da sua IA e atualize seus dados de contato para o WhatsApp.</p>
      </header>

      {/* SEÇÃO 1: DADOS CADASTRAIS */}
      <section className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-brand-50 w-10 h-10 rounded-lg flex items-center justify-center text-brand-600">
            <UserIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Meus Dados de Contato</h2>
            <p className="text-gray-500 text-sm">Atualize seu nome ou altere o telefone que usa o bot no WhatsApp.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 max-w-3xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome"
              required
              className="w-full bg-gray-50/50 border border-gray-200 focus:border-brand-500 text-gray-800 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Número do WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: +554188386283"
              required
              className="w-full bg-gray-50/50 border border-gray-200 focus:border-brand-500 text-gray-800 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
            />
            <p className="text-[10px] text-gray-400">Inclua o DDI (+55) e o DDD sem espaços ou parênteses.</p>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-brand-500/10 transition-colors"
            >
              {isSavingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </section>

      {/* SEÇÃO 1.5: MINHA META */}
      <section className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-50 w-10 h-10 rounded-lg flex items-center justify-center text-brand-600">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Minha Meta</h2>
            <p className="text-gray-500 text-sm">Sua meta direciona as análises de prato, a dieta e o treino que a IA monta pra você.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GOALS.map(g => (
            <button
              key={g.id}
              disabled={isSavingGoal}
              onClick={() => handleGoalChange(g.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                selectedGoal === g.id
                  ? 'bg-brand-50 border-brand-300 shadow-sm ring-1 ring-brand-500/20'
                  : 'bg-white border-gray-200 hover:border-brand-200 hover:bg-gray-50'
              }`}
            >
              <div className="mb-3 bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center shadow-inner border border-gray-200/50 group-hover:scale-110 transition-transform">
                {g.icon}
              </div>
              <h3 className="text-gray-900 font-bold text-sm mb-1">{g.name}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{g.desc}</p>

              {selectedGoal === g.id && (
                <div className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 bg-brand-500 rounded-full shadow-sm text-white">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
        {!selectedGoal && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4">
            Você ainda não definiu uma meta — escolha uma acima ou responda o robô no WhatsApp para personalizar tudo.
          </p>
        )}
      </section>

      {/* SEÇÃO 2: PERSONALIDADE DO ROBÔ */}
      <section className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-50 w-10 h-10 rounded-lg flex items-center justify-center text-brand-600">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Personalidade da IA</h2>
            <p className="text-gray-500 text-sm">Escolha como o seu robô vai se comunicar com você no WhatsApp.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONALITIES.map(p => (
            <button
              key={p.id}
              disabled={isSavingPersonality}
              onClick={() => handlePersonalityChange(p.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                selectedPersonality === p.id 
                  ? 'bg-brand-50 border-brand-300 shadow-sm ring-1 ring-brand-500/20' 
                  : 'bg-white border-gray-200 hover:border-brand-200 hover:bg-gray-50'
              }`}
            >
              <div className="mb-3 bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center shadow-inner border border-gray-200/50 group-hover:scale-110 transition-transform">
                {p.icon}
              </div>
              <h3 className="text-gray-900 font-bold text-sm mb-1">{p.name}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
              
              {selectedPersonality === p.id && (
                <div className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 bg-brand-500 rounded-full shadow-sm text-white">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
