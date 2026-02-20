'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getDeliverableLetters } from '@/lib/store';
import styles from './deliver.module.css';

export default function DeliveryRevealPage() {
  const { state, markLetterRead } = useApp();
  const router = useRouter();

  const deliverableLetters = useMemo(() => getDeliverableLetters(state), [state]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  // Sequential reveal — one letter at a time with stagger
  useEffect(() => {
    if (deliverableLetters.length === 0) return;

    const timers: NodeJS.Timeout[] = [];

    deliverableLetters.forEach((letter, i) => {
      const timer = setTimeout(() => {
        markLetterRead(letter.id);
        setRevealedCount(prev => prev + 1);

        if (i === deliverableLetters.length - 1) {
          setTimeout(() => setAllRevealed(true), 800);
        }
      }, 800 + i * 600); // 800ms initial delay, 600ms between each

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []); // Only run once on mount

  const handleDone = useCallback(() => {
    router.push('/');
  }, [router]);

  if (deliverableLetters.length === 0 && revealedCount === 0) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No letters waiting.</p>
          <button className={styles.returnButton} onClick={handleDone}>
            Return to mailbox
          </button>
        </div>
      </div>
    );
  }

  // Get all letters that should be shown (both just-delivered and already being revealed)
  const lettersToShow = state.letters.filter(l => {
    // Show letters that were just marked as read in this delivery session
    return deliverableLetters.some(dl => dl.id === l.id);
  });

  return (
    <div className={`page-container ${styles.deliverPage}`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {revealedCount === 0
            ? 'Your letters are arriving\u2026'
            : revealedCount === 1
              ? '1 letter'
              : `${revealedCount} letters`
          }
        </h1>
      </div>

      {/* Letters — sequential reveal */}
      <div className={styles.letterStack}>
        {lettersToShow.map((letter, i) => {
          const correspondent = state.correspondents.find(c => c.id === letter.correspondentId);
          const isRevealed = i < revealedCount;

          if (!isRevealed) return null;

          return (
            <article
              key={letter.id}
              className={styles.letter}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={styles.letterFrom}>
                {correspondent?.name || 'Someone'}
              </div>
              <div className={styles.letterContent}>
                {letter.content}
              </div>
              <div className={styles.letterTime}>
                Written {formatRelativeWriteTime(letter.writtenAt)}
              </div>
            </article>
          );
        })}
      </div>

      {/* Completion */}
      {allRevealed && (
        <div className={styles.completion}>
          <button
            className={styles.replyButton}
            onClick={() => {
              const firstLetter = lettersToShow[0];
              if (firstLetter) {
                router.push(`/compose?to=${firstLetter.correspondentId}`);
              } else {
                router.push('/');
              }
            }}
          >
            Write a reply
          </button>
          <button className={styles.doneButton} onClick={handleDone}>
            Return to mailbox
          </button>
        </div>
      )}
    </div>
  );
}

function formatRelativeWriteTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  const hour = date.getHours();
  let timeOfDay = 'at night';
  if (hour >= 5 && hour < 12) timeOfDay = 'this morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'this afternoon';
  if (hour >= 17 && hour < 21) timeOfDay = 'this evening';

  if (diffDays === 0) return timeOfDay;
  if (diffDays === 1) return `yesterday ${timeOfDay.replace('this ', '')}`;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[date.getDay()]} ${timeOfDay.replace('this ', '')}`;
}
