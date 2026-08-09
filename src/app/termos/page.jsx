import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Termos de Uso — Renascer',
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  return (
    <LegalLayout title="Termos de Uso" updated={new Date().toLocaleDateString('pt-BR')}>
      <h2>1. Aceitação dos termos</h2>
      <p>
        Ao acessar ou usar o site jeanspagolla.com.br, assinar um dos planos Renascer, ou usar o
        aplicativo Viora (via WhatsApp ou painel web), você confirma que leu, entendeu e concorda
        com estes Termos de Uso. Se não concordar, não utilize os serviços.
      </p>

      <h2>2. O que é o Renascer</h2>
      <p>
        O Renascer é um programa de acompanhamento conduzido por Jean Spagolla (Fitness & Wellness e
        Terapeuta), com dois planos:
      </p>
      <ul>
        <li><strong>Renascer Essencial:</strong> aulas em vídeo, comunidade no Skool e aulas/desafios ao vivo.</li>
        <li><strong>Renascer Completo:</strong> tudo do Essencial, mais acesso ao Viora — um assistente de nutrição e treino com inteligência artificial, disponível pelo WhatsApp e por um painel web.</li>
      </ul>
      <p>
        <strong>Aviso de saúde:</strong> o conteúdo do Renascer e as sugestões geradas pelo Viora
        (dieta, treino, estimativas de calorias) têm caráter educacional e não substituem
        acompanhamento médico ou nutricional profissional. Consulte um profissional de saúde antes
        de iniciar qualquer protocolo, especialmente se você tiver condições pré-existentes.
      </p>

      <h2>3. Conta e cadastro</h2>
      <p>
        Para assinar o Renascer Completo, é necessário criar uma conta com nome, e-mail, número de
        WhatsApp e senha. Você é responsável por manter esses dados corretos e por qualquer
        atividade realizada com sua conta.
      </p>

      <h2>4. Pagamento e cobrança</h2>
      <p>
        As assinaturas são cobradas mensalmente no cartão de crédito, processadas com segurança
        pela Stripe. Os valores vigentes de cada plano são exibidos na página de checkout no
        momento da contratação. A cobrança se repete automaticamente a cada ciclo até o
        cancelamento.
      </p>
      <p>
        Você pode cancelar quando quiser, sem multa ou fidelidade. O cancelamento interrompe as
        próximas cobranças; o acesso ao plano continua ativo até o fim do período já pago.
      </p>

      <h2>5. Uso do Viora (WhatsApp e IA)</h2>
      <p>
        O Viora usa modelos de inteligência artificial para estimar calorias e macronutrientes a
        partir de fotos de refeições, e para gerar sugestões de treino e dieta a partir de fotos
        corporais. Essas estimativas são aproximações e podem conter imprecisões — use como guia,
        não como diagnóstico. O uso do WhatsApp para essa integração segue também as políticas da
        Meta.
      </p>
      <p>
        É proibido enviar conteúdo ilegal, ofensivo, pornográfico ou de ódio pelo WhatsApp
        integrado ao Viora. O uso indevido pode levar à suspensão da conta, sem reembolso.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        O Renascer e o Viora não se responsabilizam por lesões, danos ou prejuízos decorrentes da
        adoção imprudente de treinos ou dietas sugeridas. A prática de exercícios e mudanças
        alimentares deve considerar as condições de saúde individuais de cada pessoa.
      </p>

      <h2>7. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados periodicamente. Mudanças relevantes serão comunicadas
        pelos canais de contato informados na sua conta.
      </p>

      <h2>8. Contato</h2>
      <p>
        Dúvidas sobre estes Termos podem ser enviadas para{' '}
        <a href="mailto:contato@jeanspagolla.com.br">contato@jeanspagolla.com.br</a>.
      </p>
    </LegalLayout>
  );
}
