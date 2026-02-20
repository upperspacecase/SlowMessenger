'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loadState, saveState, type AppState, type Letter, type Correspondent, generateId, getNextDeliveryTime } from './store';

interface AppContextType {
  state: AppState;
  isLoaded: boolean;
  // Actions
  completeOnboarding: (name: string, deliveryHour: number, deliveryMinute: number) => void;
  addCorrespondent: (name: string, note?: string) => void;
  sealLetter: (correspondentId: string, content: string) => void;
  markLetterRead: (letterId: string) => void;
  markAllDelivered: () => void;
  updateDeliveryTime: (hour: number, minute: number) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    onboarded: false,
    deliveryHour: 8,
    deliveryMinute: 0,
    userName: '',
    correspondents: [],
    letters: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  const persist = useCallback((newState: AppState) => {
    setState(newState);
    saveState(newState);
  }, []);

  const completeOnboarding = useCallback((name: string, deliveryHour: number, deliveryMinute: number) => {
    persist({
      ...state,
      onboarded: true,
      userName: name,
      deliveryHour,
      deliveryMinute,
    });
  }, [state, persist]);

  const addCorrespondent = useCallback((name: string, note?: string) => {
    const correspondent: Correspondent = {
      id: generateId(),
      name,
      invitedAt: new Date().toISOString(),
      note,
    };
    persist({
      ...state,
      correspondents: [...state.correspondents, correspondent],
    });
  }, [state, persist]);

  const sealLetter = useCallback((correspondentId: string, content: string) => {
    const now = new Date();
    const deliverAt = getNextDeliveryTime(state.deliveryHour, state.deliveryMinute);

    const letter: Letter = {
      id: generateId(),
      correspondentId,
      content,
      writtenAt: now.toISOString(),
      deliverAt: deliverAt.toISOString(),
      sealedAt: now.toISOString(),
      fromSelf: true,
      read: true, // User's own letters are immediately "read"
    };
    persist({
      ...state,
      letters: [...state.letters, letter],
    });
  }, [state, persist]);

  const markLetterRead = useCallback((letterId: string) => {
    persist({
      ...state,
      letters: state.letters.map(l =>
        l.id === letterId ? { ...l, read: true, deliveredAt: new Date().toISOString() } : l
      ),
    });
  }, [state, persist]);

  const markAllDelivered = useCallback(() => {
    const now = new Date();
    persist({
      ...state,
      letters: state.letters.map(l => {
        if (!l.fromSelf && !l.read && new Date(l.deliverAt) <= now) {
          return { ...l, read: true, deliveredAt: now.toISOString() };
        }
        return l;
      }),
      lastDeliveryCheck: now.toISOString(),
    });
  }, [state, persist]);

  const updateDeliveryTime = useCallback((hour: number, minute: number) => {
    persist({
      ...state,
      deliveryHour: hour,
      deliveryMinute: minute,
    });
  }, [state, persist]);

  const resetState = useCallback(() => {
    const fresh = {
      onboarded: false,
      deliveryHour: 8,
      deliveryMinute: 0,
      userName: '',
      correspondents: [],
      letters: [],
    };
    persist(fresh);
  }, [persist]);

  return (
    <AppContext.Provider value={{
      state,
      isLoaded,
      completeOnboarding,
      addCorrespondent,
      sealLetter,
      markLetterRead,
      markAllDelivered,
      updateDeliveryTime,
      resetState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
