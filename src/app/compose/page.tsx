'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { formatDeliveryTime, getNextDeliveryTime } from '@/lib/store';
import styles from './compose.module.css';

function ComposeInner() {
  const { state, sealLetter } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const correspondentId = searchParams.get('to') || '';
  const correspondent = state.correspondents.find(c => c.id === correspondentId);

  const [content, setContent] = useState('');
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  const nextDelivery = getNextDeliveryTime(state.deliveryHour, state.deliveryMinute);
  const isNextDay = nextDelivery.getDate() !== new Date().getDate();
  const deliveryLabel = isNextDay
    ? `tomorrow at ${formatDeliveryTime(state.deliveryHour, state.deliveryMinute).toLowerCase()}`
    : `today at ${formatDeliveryTime(state.deliveryHour, state.deliveryMinute).toLowerCase()}`;

  // Auto-focus textarea
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  const handleSeal = useCallback(() => {
    if (!content.trim() || !correspondentId) return;

    setIsSealing(true);

    // "Seal" animation — 700ms fold, then show confirmation
    setTimeout(() => {
      sealLetter(correspondentId, content.trim());
      setIsSealing(false);
      setIsSealed(true);

      // Return to mailbox after a pause
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }, 700);
  }, [content, correspondentId, sealLetter, router]);

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
          No correspondent found.
        </p>
      </div>
    );
  }

  if (isSealed) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.sealedConfirmation}>
          <p className={styles.sealedText}>Sealed.</p>
          <p className={styles.sealedMeta}>It arrives {deliveryLabel}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-container ${styles.composePage}`}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <span aria-hidden="true">&larr;</span>
          <span className={styles.backLabel}>Back</span>
        </button>
        <div className={styles.recipient}>
          <span className={styles.toLabel}>To</span>
          <span className={styles.toName}>{correspondent.name}</span>
        </div>
      </div>

      {/* Writing space — "a blank page on a writing desk" */}
      <div className={`${styles.writingSpace} ${isSealing ? styles.sealing : ''}`}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={content}
          onChange={handleChange}
          placeholder="A blank page. The best kind."
          rows={6}
          disabled={isSealing}
        />
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.deliveryNote}>
          Arrives {deliveryLabel}
        </div>
        <button
          className={styles.sealButton}
          onClick={handleSeal}
          disabled={!content.trim() || isSealing}
        >
          Seal &amp; send
        </button>
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-warm-grey)' }}>Arriving&hellip;</p>
      </div>
    }>
      <ComposeInner />
    </Suspense>
  );
}
