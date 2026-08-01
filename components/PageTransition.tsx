'use client';
import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Inner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const ref = useRef<HTMLDivElement>(null);

  // Move o foco pro conteúdo novo a cada navegação — sem isso, leitores de
  // tela ficam "presos" no link que disparou a navegação anterior, já que
  // não há recarregamento de página real (é tudo client-side routing).
  useEffect(() => {
    ref.current?.focus();
  }, [key]);

  return (
    <div key={key} ref={ref} className="page-transition" tabIndex={-1}>
      {children}
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="page-transition">{children}</div>}>
      <Inner>{children}</Inner>
    </Suspense>
  );
}
