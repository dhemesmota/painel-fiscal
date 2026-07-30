'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { addMonths, monthLabel, todayYM } from '@/lib/simplesNacional';

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
      <button onClick={() => navigate(-1)}>‹</button>
      <div className="label">{monthLabel(mes)}</div>
      <button onClick={() => navigate(1)}>›</button>
    </div>
  );
}

export function MonthNav() {
  return (
    <Suspense fallback={<div className="month-nav"><button>‹</button><div className="label">…</div><button>›</button></div>}>
      <MonthNavInner />
    </Suspense>
  );
}
