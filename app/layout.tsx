import '../styles/globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import ThemeProvider from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Admissions Dashboard',
  description: 'Ontario university admissions analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-QZS1W0VTBJ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-QZS1W0VTBJ');
        `}</Script>
      </head>
      <body className="bg-gray-50 dark:bg-[#212121] text-gray-900 dark:text-white min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
