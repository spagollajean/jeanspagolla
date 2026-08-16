import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <Logo withBadge style={{ justifyContent: 'center', marginBottom: '1rem' }} />
        <p>© {new Date().getFullYear()} Protocolo Renascer & Viora Health Technologies. Todos os direitos reservados.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--bone-faint)' }}>
          Este produto não substitui o parecer médico profissional. Sempre consulte um médico para questões de saúde.
        </p>
        <p style={{ fontSize: '0.78rem', marginTop: '0.9rem' }}>
          <a href="/termos" style={{ color: 'var(--bone-soft)' }}>Termos de Uso</a>
          {' · '}
          <a href="/privacidade" style={{ color: 'var(--bone-soft)' }}>Política de Privacidade</a>
          {' · '}
          <a href="/exclusao-de-dados" style={{ color: 'var(--bone-soft)' }}>Exclusão de Dados</a>
        </p>
      </div>
    </footer>
  );
}
