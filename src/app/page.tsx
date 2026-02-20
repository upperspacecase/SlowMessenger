'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Mailbox } from '@/components/Mailbox';

export default function HomePage() {
  const { state, isLoaded } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !state.onboarded) {
      router.replace('/onboarding');
    }
  }, [isLoaded, state.onboarded, router]);

  if (!isLoaded) {
    return (
      <div className="page-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--color-warm-grey)',
          fontSize: 'var(--text-lg)',
          animation: 'breathe 3s var(--ease-breathe) infinite',
        }}>
          Arriving&hellip;
        </p>
      </div>
    );
  }

  if (!state.onboarded) {
    return null;
  }

  return <Mailbox />;
}
