import Header from './Header';
import Footer from './Footer';

export default function LegalLayout({ title, updated, children }) {
  return (
    <>
      <Header />
      <main className="section-light pad legal-page">
        <div className="wrap wrap--narrow">
          <h1 style={{ marginBottom: '0.4rem' }}>{title}</h1>
          <p className="legal-updated">Última atualização: {updated}</p>
          <div className="legal-body">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
