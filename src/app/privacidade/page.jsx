import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Política de Privacidade — Renascer',
  robots: { index: true, follow: true },
};

export default function PrivacidadePage() {
  return (
    <LegalLayout title="Política de Privacidade" updated={new Date().toLocaleDateString('pt-BR')}>
      <h2>1. Introdução</h2>
      <p>
        Esta Política explica como o Renascer (jeanspagolla.com.br) e o aplicativo Viora coletam,
        usam, armazenam e protegem seus dados pessoais, em conformidade com a Lei Geral de Proteção
        de Dados (LGPD).
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li><strong>Dados de cadastro:</strong> nome, e-mail, número de WhatsApp e senha (criptografada).</li>
        <li><strong>Dados de pagamento:</strong> processados diretamente pela Stripe — não armazenamos número de cartão em nossos servidores.</li>
        <li><strong>Dados de uso do Viora (plano Completo):</strong> fotos de refeições e do corpo enviadas voluntariamente para análise por IA, histórico de conversas no WhatsApp, metas e objetivos informados.</li>
      </ul>

      <h2>3. Como usamos seus dados</h2>
      <ul>
        <li>Processar sua assinatura e liberar o acesso ao plano contratado.</li>
        <li>Gerar as análises nutricionais e de treino do Viora via inteligência artificial.</li>
        <li>Enviar e-mails transacionais (confirmação de pagamento, recibo, cancelamento) e mensagens pelo WhatsApp.</li>
        <li>Dar suporte e responder dúvidas sobre sua conta.</li>
      </ul>

      <h2>4. Com quem compartilhamos</h2>
      <p>Usamos os seguintes provedores para operar o serviço — todos tratando os dados apenas para esse fim:</p>
      <ul>
        <li><strong>Stripe:</strong> processamento de pagamentos.</li>
        <li><strong>Supabase:</strong> armazenamento de conta e dados de uso.</li>
        <li><strong>OpenAI:</strong> análise de imagens (fotos de refeições e corpo) para o Viora.</li>
        <li><strong>Meta (WhatsApp Cloud API):</strong> envio e recebimento de mensagens do Viora pelo WhatsApp.</li>
        <li><strong>Resend:</strong> envio de e-mails transacionais.</li>
      </ul>
      <p>Não vendemos seus dados pessoais para terceiros.</p>

      <h2>5. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não
        autorizado, incluindo criptografia de senha e comunicação via HTTPS em todos os serviços.
      </p>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>
        Você pode solicitar a qualquer momento a confirmação, correção, portabilidade ou exclusão
        dos seus dados pessoais. Veja a página de{' '}
        <a href="/exclusao-de-dados">Exclusão de Dados</a> para o processo completo.
      </p>

      <h2>7. Contato</h2>
      <p>
        Dúvidas sobre esta Política podem ser enviadas para{' '}
        <a href="mailto:contato@jeanspagolla.com.br">contato@jeanspagolla.com.br</a>.
      </p>
    </LegalLayout>
  );
}
