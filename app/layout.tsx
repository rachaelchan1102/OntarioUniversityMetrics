import '../styles/globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import ThemeProvider from '../components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'Ontario University Metrics',
  description: 'Ontario university admissions analytics',
  icons: { icon: '/oum-logo-2b-40px@4x.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Applies the saved theme before paint so nothing flashes. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var saved = localStorage.getItem('theme-pref');
            if (saved === 'dark') document.documentElement.classList.add('dark');
          })();
        `}} />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-QZS1W0VTBJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-QZS1W0VTBJ');
        `}</Script>
      </head>
      {/* Background and text colour come from the CSS variables in globals.css.
          The theme toggle lives inside each page so it aligns with that page's
          content width, as in the mockups. */}
      <body className="min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
