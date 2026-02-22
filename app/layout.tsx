import '../styles/globals.css';
import type { Metadata } from 'next';
import ThemeProvider from '../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Admissions Dashboard',
  description: 'Ontario university admissions analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-50 dark:bg-[#212121] text-gray-900 dark:text-white min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
