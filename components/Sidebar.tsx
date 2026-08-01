'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MastheadPill } from '@/components/MastheadPill';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import {
  HomeIcon, FileTextIcon, UploadIcon, PercentIcon, CalendarIcon, CompassIcon,
  BriefcaseIcon, MenuIcon, XIcon,
} from '@/components/icons';

const TABS = [
  { label: 'Painel',        href: '/painel',            Icon: HomeIcon },
  { label: 'Notas Fiscais', href: '/painel/notas',       Icon: FileTextIcon },
  { label: 'Importar',      href: '/painel/importar',    Icon: UploadIcon },
  { label: 'Imposto',       href: '/painel/imposto',     Icon: PercentIcon },
  { label: 'Calendário',    href: '/painel/calendario',  Icon: CalendarIcon },
  { label: 'Guia',          href: '/painel/guia',        Icon: CompassIcon },
  { label: 'Empresa',       href: '/painel/empresa',     Icon: BriefcaseIcon },
];

interface Props {
  razaoSocial: string;
  cnpj: string;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mes = searchParams.get('mes');

  return (
    <nav className="sidebar-nav" aria-label="Navegação principal">
      {TABS.map(({ label, href, Icon }) => {
        const isActive = pathname === href;
        const linkHref = mes ? `${href}?mes=${mes}` : href;
        return (
          <Link
            key={href}
            href={linkHref}
            className={`nav-link${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ razaoSocial, cnpj }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="eyebrow">Painel Fiscal · Simples Nacional</div>
          <p className="sidebar-brand-name">{razaoSocial}</p>
          {cnpj && <div className="cnpj">CNPJ {cnpj}</div>}
          <Suspense fallback={null}>
            <MastheadPill />
          </Suspense>
        </div>
        <Suspense fallback={<div className="sidebar-nav" />}>
          <NavLinks />
        </Suspense>
        <div className="sidebar-footer">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      <header className="mobile-topbar">
        <button
          type="button"
          className="icon-toggle"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <MenuIcon />
        </button>
        <span className="mobile-topbar-title">{razaoSocial}</span>
        <ThemeToggle />
      </header>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)}>
          <div
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Painel Fiscal</div>
                <strong style={{ fontSize: 14 }}>{razaoSocial}</strong>
              </div>
              <button
                type="button"
                className="icon-toggle"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <XIcon />
              </button>
            </div>
            <Suspense fallback={<div className="sidebar-nav" />}>
              <NavLinks onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}
