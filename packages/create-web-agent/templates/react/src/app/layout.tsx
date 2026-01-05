import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web Agent App',
  description: 'A Web Agent Framework application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

