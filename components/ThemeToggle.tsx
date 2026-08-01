'use client';
import { SunIcon, MoonIcon } from '@/components/icons';

// Ambos os ícones ficam sempre no DOM; o CSS decide qual mostrar com base no
// atributo data-theme (ou no prefers-color-scheme, se não houver preferência
// salva) — evita qualquer mismatch de hidratação, já que o markup não muda.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = current ? current === 'dark' : systemDark;
    const next = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage indisponível (modo privado etc.) — só não persiste.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-toggle theme-toggle"
      aria-label="Alternar tema claro/escuro"
    >
      <SunIcon className="icon-sun" />
      <MoonIcon className="icon-moon" />
    </button>
  );
}
