import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Exclusão de Dados — Renascer',
  robots: { index: true, follow: true },
};

export default function ExclusaoDeDadosPage() {
  return (
    <LegalLayout title="Exclusão de Dados" updated={new Date().toLocaleDateString('pt-BR')}>
      <p>
        De acordo com a LGPD e as políticas da Meta, você tem o direito de solicitar a exclusão
        completa dos dados armazenados pela sua conta Renascer/Viora a qualquer momento.
      </p>

      <div className="legal-callout">
        <h3>O que é excluído</h3>
        <ul>
          <li>Sua conta (e-mail, senha e dados de cadastro).</li>
          <li>Histórico de conversas e vínculo com o número de WhatsApp.</li>
          <li>Fotos de refeições/corpo e análises geradas pela IA.</li>
          <li>Metas, objetivos e histórico de evolução registrados.</li>
        </ul>
      </div>

      <h2>Como solicitar</h2>
      <p>
        Envie um e-mail para{' '}
        <a href="mailto:contato@jeanspagolla.com.br">contato@jeanspagolla.com.br</a> com o
        assunto "Exclusão de dados", informando o nome completo, e-mail e número de WhatsApp
        associados à sua conta. O prazo máximo de processamento é de 7 dias úteis.
      </p>

      <h2>O que acontece depois</h2>
      <p>
        Após a exclusão, você perde o acesso ao histórico de dietas, treinos e conversas — essa
        ação é irreversível. Registros financeiros da sua assinatura podem ser mantidos por tempo
        determinado apenas pelas obrigações legais/fiscais da processadora de pagamentos, sem
        ligação com o uso diário do aplicativo.
      </p>
    </LegalLayout>
  );
}
