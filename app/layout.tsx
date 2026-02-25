import '../styles/globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import ThemeProvider from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Ontario University Metrics',
  description: 'Ontario university admissions analytics',
  icons: { icon: '/ontariouniversitymetriclogo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
      <body className="bg-gray-50 dark:bg-[#212121] text-gray-900 dark:text-white min-h-screen">
        <ThemeProvider>
          <header className="sticky top-0 z-40 bg-transparent">
            <div className="max-w-6xl mx-auto px-5 sm:px-10 h-14 flex items-center justify-end">
              <ThemeToggle />
            </div>
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
