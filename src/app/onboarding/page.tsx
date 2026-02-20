'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { formatDeliveryTime, createDemoData } from '@/lib/store';
import { DeliveryTimePicker } from '@/components/DeliveryTimePicker';
import styles from './onboarding.module.css';

type OnboardingStep = 'welcome' | 'name' | 'time' | 'invite' | 'complete';

function OnboardingInner() {
  const { state, completeOnboarding, addCorrespondent } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // If coming from mailbox with ?step=invite, jump to invite step
  const initialStep = searchParams.get('step') === 'invite' ? 'invite' : 'welcome';
  const isAddingCorrespondent = initialStep === 'invite' && state.onboarded;

  const [step, setStep] = useState<OnboardingStep>(initialStep as OnboardingStep);
  const [userName, setUserName] = useState(state.userName || '');
  const [deliveryHour, setDeliveryHour] = useState(state.deliveryHour || 8);
  const [deliveryMinute, setDeliveryMinute] = useState(state.deliveryMinute || 0);
  const [correspondentName, setCorrespondentName] = useState('');
  const [inviteNote, setInviteNote] = useState("I'd like to write letters with you.");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const correspondentInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'name') nameInputRef.current?.focus();
      if (step === 'invite') correspondentInputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, [step]);

  const handleTimeSelect = useCallback((hour: number, minute: number) => {
    setDeliveryHour(hour);
    setDeliveryMinute(minute);
    setStep('invite');
  }, []);

  const handleInvite = useCallback(() => {
    if (!correspondentName.trim()) return;

    addCorrespondent(correspondentName.trim(), inviteNote.trim() || undefined);

    if (isAddingCorrespondent) {
      router.push('/');
      return;
    }

    // Complete onboarding
    completeOnboarding(userName.trim(), deliveryHour, deliveryMinute);
    setStep('complete');

    // Navigate to home after the completion moment
    setTimeout(() => {
      router.push('/');
    }, 3000);
  }, [correspondentName, inviteNote, isAddingCorrespondent, userName, deliveryHour, deliveryMinute, addCorrespondent, completeOnboarding, router]);

  const handleSkipInvite = useCallback(() => {
    if (isAddingCorrespondent) {
      router.push('/');
      return;
    }

    // Complete onboarding and create demo data
    completeOnboarding(userName.trim(), deliveryHour, deliveryMinute);
    setStep('complete');

    setTimeout(() => {
      router.push('/');
    }, 3000);
  }, [isAddingCorrespondent, userName, deliveryHour, deliveryMinute, completeOnboarding, router]);

  // STEP: Welcome
  if (step === 'welcome') {
    return (
      <div className={`page-container ${styles.stepContainer}`}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Slow Messenger
          </h1>
          <p className={styles.welcomeSubtitle}>
            Letters, not messages.
          </p>
          <p className={styles.welcomeDescription}>
            Your words arrive once a day, at a time you choose.
            No read receipts. No typing indicators.
            Just the care of a handwritten letter,
            with the convenience of your phone.
          </p>
          <button
            className={styles.continueButton}
            onClick={() => setStep('name')}
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // STEP: Name
  if (step === 'name') {
    return (
      <div className={`page-container ${styles.stepContainer}`}>
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>What shall we call you?</h2>
          <p className={styles.stepDescription}>
            This is how your name will appear on your letters.
          </p>
          <input
            ref={nameInputRef}
            type="text"
            className={styles.textInput}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userName.trim()) setStep('time');
            }}
          />
          <button
            className={styles.continueButton}
            onClick={() => setStep('time')}
            disabled={!userName.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // STEP: Delivery time
  if (step === 'time') {
    return (
      <div className={`page-container ${styles.stepContainer}`}>
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Choose your hour</h2>
          <p className={styles.stepDescription}>
            When would you like your letters to arrive?
            Think of it as setting a daily ritual.
          </p>
          <DeliveryTimePicker
            initialHour={deliveryHour}
            initialMinute={deliveryMinute}
            onSelect={handleTimeSelect}
          />
        </div>
      </div>
    );
  }

  // STEP: Invite correspondent
  if (step === 'invite') {
    return (
      <div className={`page-container ${styles.stepContainer}`}>
        <div className={styles.stepContent}>
          {isAddingCorrespondent && (
            <button className={styles.backButton} onClick={() => router.push('/')}>
              <span aria-hidden="true">&larr;</span> Mailbox
            </button>
          )}
          <h2 className={styles.stepTitle}>
            {isAddingCorrespondent ? 'Invite a correspondent' : 'Invite your first correspondent'}
          </h2>
          <p className={styles.stepDescription}>
            Who would you like to exchange letters with?
          </p>
          <input
            ref={correspondentInputRef}
            type="text"
            className={styles.textInput}
            value={correspondentName}
            onChange={(e) => setCorrespondentName(e.target.value)}
            placeholder="Their name"
          />
          <textarea
            className={styles.noteInput}
            value={inviteNote}
            onChange={(e) => setInviteNote(e.target.value)}
            placeholder="Add a personal note..."
            rows={2}
          />
          <div className={styles.inviteActions}>
            <button
              className={styles.continueButton}
              onClick={handleInvite}
              disabled={!correspondentName.trim()}
            >
              Send invitation
            </button>
            <button className={styles.skipButton} onClick={handleSkipInvite}>
              {isAddingCorrespondent ? 'Cancel' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP: Complete
  if (step === 'complete') {
    return (
      <div className={`page-container ${styles.stepContainer}`}>
        <div className={styles.completeContent}>
          <p className={styles.completeText}>
            Your letters arrive at {formatDeliveryTime(deliveryHour, deliveryMinute).toLowerCase()}.
          </p>
          <p className={styles.completeSubtext}>
            Welcome to a slower conversation.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-warm-grey)' }}>Arriving&hellip;</p>
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  );
}
