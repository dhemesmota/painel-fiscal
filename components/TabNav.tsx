'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const TABS = [
  { label: 'Painel',        href: '/painel' },
  { label: 'Notas Fiscais', href: '/painel/notas' },
  { label: 'Imposto',       href: '/painel/imposto' },
  { label: 'Calendário',    href: '/painel/calendario' },
  { label: 'Guia',          href: '/painel/guia' },
  { label: 'Empresa',       href: '/painel/empresa' },
];

function TabNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mes = searchParams.get('mes');

  return (
    <nav className="tabs">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        const href = mes ? `${tab.href}?mes=${mes}` : tab.href;
        return (
          <Link key={tab.href} href={href} className={`tab${isActive ? ' active' : ''}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabNav() {
  return (
    <Suspense fallback={<nav className="tabs" />}>
      <TabNavInner />
    </Suspense>
  );
}
