import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Roboto_Condensed, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

const disp = Roboto_Condensed({ subsets: ['latin', 'greek'], weight: ['600', '700', '800'], variable: '--f-disp' });
const ui = IBM_Plex_Sans({ subsets: ['latin', 'greek'], weight: ['400', '500', '600'], variable: '--f-ui' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--f-num' });

export const metadata = {
  title: 'Νέες Οικοδομές Radar',
  description: 'Οι νέες οικοδομικές άδειες της περιοχής σου κάθε πρωί, για να φτάνεις πρώτος στη δουλειά.',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="el" className={`${disp.variable} ${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
