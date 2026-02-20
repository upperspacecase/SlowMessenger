'use client';

import React, { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getCorrespondenceLetters, formatWrittenTime, formatDeliveredTime } from '@/lib/store';
import styles from './correspondence.module.css';

function CorrespondenceInner() {
  const { state } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const correspondentId = searchParams.get('id') || '';
  const correspondent = state.correspondents.find(c => c.id === correspondentId);
  const letters = useMemo(
    () => getCorrespondenceLetters(state, correspondentId),
    [state, correspondentId]
  );

  if (!correspondent) {
    return (
      <div className="page-container">
        <p style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--color-warm-grey)',
          fontStyle: 'italic',
          textAlign: 'center',
          paddingTop: 'var(--space-10)',
        }}>
          Correspondent not found.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/')}>
          <span aria-hidden="true">&larr;</span>
          <span className={styles.backLabel}>Mailbox</span>
        </button>
        <h1 className={styles.name}>{correspondent.name}</h1>
        <p className={styles.meta}>
          {letters.length === 0
            ? 'A blank page. The best kind.'
            : `${letters.length} ${letters.length === 1 ? 'letter' : 'letters'} exchanged`
          }
        </p>
      </div>

      {/* Letters — "a collected bundle, not a chat log" */}
      <div className={styles.letterBundle}>
        {letters.map((letter, i) => (
          <article
            key={letter.id}
            className={styles.letter}
            style={{ animationDelay: `${300 + i * 170}ms` }}
          >
            <div className={styles.letterContent}>
              {letter.content}
            </div>
            <div className={styles.letterMeta}>
              <span>{letter.fromSelf ? state.userName : correspondent.name}</span>
              <span className={styles.metaDot}>&middot;</span>
              <span>{formatWrittenTime(letter.writtenAt)}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Write action */}
      <div className={styles.actions}>
        <button
          className={styles.writeButton}
          onClick={() => router.push(`/compose?to=${correspondentId}`)}
        >
          Write a letter
        </button>
      </div>
    </div>
  );
}

export default function CorrespondencePage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-warm-grey)' }}>Arriving&hellip;</p>
      </div>
    }>
      <CorrespondenceInner />
    </Suspense>
  );
}
