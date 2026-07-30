import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Painel Fiscal · Simples Nacional',
  description: 'Calculadora e organizador fiscal para ME/EPP do Simples Nacional',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
