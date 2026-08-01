'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { addMonths, monthLabel, todayYM } from '@/lib/simplesNacional';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

function MonthNavInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mes = searchParams.get('mes') || todayYM();

  function navigate(delta: number) {
    const newMes = addMonths(mes, delta);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mes', newMes);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="month-nav">
      <button type="button" onClick={() => navigate(-1)} aria-label="Mês anterior">
        <ChevronLeftIcon width={17} height={17} />
      </button>
      <div className="label" aria-live="polite">{monthLabel(mes)}</div>
      <button type="button" onClick={() => navigate(1)} aria-label="Próximo mês">
        <ChevronRightIcon width={17} height={17} />
      </button>
    </div>
  );
}

export function MonthNav() {
  return (
    <Suspense fallback={<div className="month-nav"><button aria-hidden="true" /><div className="label">…</div><button aria-hidden="true" /></div>}>
      <MonthNavInner />
    </Suspense>
  );
}
