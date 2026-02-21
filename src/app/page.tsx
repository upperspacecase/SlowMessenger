'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Mailbox } from '@/components/Mailbox';

function LoadingScreen() {
  return (
    <div className="page-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <p style={{
        fontFamily: 'Lora, Georgia, serif',
        color: '#9B9186',
        fontSize: '1.25rem',
        animation: 'breathe 3s ease-in-out infinite',
      }}>
        Arriving&hellip;
      </p>
    </div>
  );
}

export default function HomePage() {
  const { state, isLoaded } = useApp();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoaded && !state.onboarded) {
      setRedirecting(true);
      router.replace('/onboarding');
    }
  }, [isLoaded, state.onboarded, router]);

  if (!isLoaded || redirecting) {
    return <LoadingScreen />;
  }

  if (!state.onboarded) {
    return <LoadingScreen />;
  }

  return <Mailbox />;
}
