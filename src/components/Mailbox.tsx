'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getDeliverableLetters, isDeliveryTime } from '@/lib/store';
import { DeliveryClock } from './DeliveryClock';
import styles from './Mailbox.module.css';

export function Mailbox() {
  const { state } = useApp();
  const router = useRouter();

  const deliverableLetters = useMemo(() => getDeliverableLetters(state), [state]);
  const hasWaitingLetters = deliverableLetters.length > 0;
  const inDeliveryWindow = isDeliveryTime(state.deliveryHour, state.deliveryMinute);

  // Count sealed letters in transit (user's own unsent letters)
  const inTransitCount = state.letters.filter(l => {
    if (!l.fromSelf) return false;
    const deliverAt = new Date(l.deliverAt);
    return deliverAt > new Date();
  }).length;

  return (
    <div className="page-container">
      <DeliveryClock
        deliveryHour={state.deliveryHour}
        deliveryMinute={state.deliveryMinute}
        hasLetters={hasWaitingLetters}
      />

      {/* Delivery moment — letters waiting */}
      {hasWaitingLetters && (
        <div className={styles.deliveryNotice} style={{ animationDelay: '200ms' }}>
          <button
            className={styles.deliveryButton}
            onClick={() => router.push('/deliver')}
          >
            <span className={styles.deliveryCount}>
              You have {deliverableLetters.length === 1
                ? '1 letter'
                : `${deliverableLetters.length} letters`
              } this {getTimeOfDayWord()}
            </span>
            <span className={styles.deliveryHint}>Open your letters</span>
          </button>
        </div>
      )}

      {/* Quiet state — no letters waiting */}
      {!hasWaitingLetters && (
        <div className={styles.quietState} style={{ animationDelay: '300ms' }}>
          <p className={styles.quietMessage}>
            {inTransitCount > 0
              ? `${inTransitCount === 1 ? 'A letter is' : `${inTransitCount} letters are`} on their way.`
              : 'Quiet for now.'
            }
          </p>
        </div>
      )}

      {/* Correspondents */}
      <div className={styles.correspondents} style={{ animationDelay: '400ms' }}>
        {state.correspondents.map((correspondent, i) => (
          <button
            key={correspondent.id}
            className={styles.correspondentCard}
            style={{ animationDelay: `${450 + i * 150}ms` }}
            onClick={() => router.push(`/correspondence?id=${correspondent.id}`)}
          >
            <span className={styles.correspondentName}>{correspondent.name}</span>
            <span className={styles.correspondentMeta}>
              {getLetterCount(state.letters, correspondent.id)} letters exchanged
            </span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions} style={{ animationDelay: '600ms' }}>
        {state.correspondents.length > 0 && (
          <button
            className={styles.writeButton}
            onClick={() => {
              const firstCorrespondent = state.correspondents[0];
              router.push(`/compose?to=${firstCorrespondent.id}`);
            }}
          >
            Write a letter
          </button>
        )}
        <button
          className={styles.inviteButton}
          onClick={() => router.push('/onboarding?step=invite')}
        >
          {state.correspondents.length === 0
            ? 'Invite your first correspondent'
            : 'Invite a correspondent'
          }
        </button>
      </div>
    </div>
  );
}

function getTimeOfDayWord(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'evening';
}

function getLetterCount(letters: { correspondentId: string; read: boolean }[], correspondentId: string): number {
  return letters.filter(l => l.correspondentId === correspondentId && l.read).length;
}
