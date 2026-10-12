import Logo from './Logo';
import Footer from './Footer';

export default function LegalPage({ title, updated, children }) {
  return (
    <>
      <header className="bar"><div className="wrap"><Logo /></div></header>
      <main className="wrap" style={{ maxWidth: 760, paddingBlock: '40px 24px', lineHeight: 1.7, color: '#C9D2CD' }}>
        <h1 className="disp" style={{ fontSize: 36, margin: '0 0 4px' }}>{title}</h1>
        <p className="fine" style={{ marginTop: 0 }}>Τελευταία ενημέρωση: {updated}</p>
        {children}
      </main>
      <Footer />
    </>
  );
}
