import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter_Tight, Manrope, JetBrains_Mono } from 'next/font/google';

const disp = Inter_Tight({ subsets: ['latin', 'greek'], weight: ['600', '700', '800'], variable: '--f-disp' });
const ui = Manrope({ subsets: ['latin', 'greek'], weight: ['400', '500', '600', '700', '800'], variable: '--f-ui' });
const mono = JetBrains_Mono({ subsets: ['latin', 'greek'], weight: ['500', '700'], variable: '--f-num' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', locale: 'el_GR', siteName: 'Νέες Οικοδομές Radar' },
  title: 'Νέες Οικοδομές Radar',
  description: 'Κάθε νέα οικοδομή στην περιοχή σου, πριν από τον ανταγωνισμό. Οι νέες οικοδομικές άδειες κάθε πρωί, με το πότε θα χρειαστούν αυτό που πουλάς.',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#07090A' };

export default function RootLayout({ children }) {
  return (
    <html lang="el" className={`${disp.variable} ${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
