'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { monthLabel, todayYM } from '@/lib/simplesNacional';

function Pill() {
  const searchParams = useSearchParams();
  const mes = searchParams.get('mes') || todayYM();
  return <div className="pill">{monthLabel(mes)}</div>;
}

export function MastheadPill() {
  return (
    <Suspense fallback={<div className="pill">…</div>}>
      <Pill />
    </Suspense>
  );
}
