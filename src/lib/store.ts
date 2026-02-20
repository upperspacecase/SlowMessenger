/* ============================================
   SLOW MESSENGER — Local State & Persistence
   ============================================ */

export interface Letter {
  id: string;
  correspondentId: string;
  content: string;
  writtenAt: string;        // ISO timestamp — when the letter was composed
  deliverAt: string;        // ISO timestamp — when it should be delivered
  deliveredAt?: string;     // ISO timestamp — when it was actually revealed
  sealedAt: string;         // ISO timestamp — when it was "sealed"
  fromSelf: boolean;        // true = written by user, false = received
  read: boolean;
}

export interface Correspondent {
  id: string;
  name: string;
  invitedAt: string;
  note?: string;           // Personal note sent with the invitation
}

export interface AppState {
  onboarded: boolean;
  deliveryHour: number;       // 0-23, the chosen delivery hour
  deliveryMinute: number;     // 0 or 30
  userName: string;
  correspondents: Correspondent[];
  letters: Letter[];
  lastDeliveryCheck?: string; // ISO date of last delivery reveal
}

const STORAGE_KEY = 'slow-messenger-state';

const DEFAULT_STATE: AppState = {
  onboarded: false,
  deliveryHour: 8,
  deliveryMinute: 0,
  userName: '',
  correspondents: [],
  letters: [],
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDeliveryTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute === 0 ? '00' : String(minute).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function getNextDeliveryTime(hour: number, minute: number): Date {
  const now = new Date();
  const delivery = new Date(now);
  delivery.setHours(hour, minute, 0, 0);

  // If delivery time has passed today, next delivery is tomorrow
  if (delivery <= now) {
    delivery.setDate(delivery.getDate() + 1);
  }
  return delivery;
}

export function isDeliveryTime(hour: number, minute: number): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  // Delivery window is 30 minutes from the set time
  const deliveryStart = hour * 60 + minute;
  const current = currentHour * 60 + currentMinute;
  return current >= deliveryStart && current < deliveryStart + 30;
}

export function getTimeOfDayLabel(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function formatWrittenTime(isoString: string): string {
  const date = new Date(isoString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  const timeOfDay = getTimeOfDayLabel(date);
  return `Written ${dayName} ${timeOfDay}`;
}

export function formatDeliveredTime(isoString: string, deliveryHour: number, deliveryMinute: number): string {
  const date = new Date(isoString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  return `Delivered ${dayName} ${formatDeliveryTime(deliveryHour, deliveryMinute).toLowerCase()}`;
}

export function getPendingLetters(state: AppState): Letter[] {
  return state.letters.filter(l => !l.fromSelf && !l.read);
}

export function getDeliverableLetters(state: AppState): Letter[] {
  const now = new Date();
  return state.letters.filter(l => {
    if (l.fromSelf || l.read) return false;
    const deliverAt = new Date(l.deliverAt);
    return deliverAt <= now;
  });
}

export function getCorrespondenceLetters(state: AppState, correspondentId: string): Letter[] {
  return state.letters
    .filter(l => l.correspondentId === correspondentId && l.read)
    .sort((a, b) => new Date(a.sealedAt).getTime() - new Date(b.sealedAt).getTime());
}

export function createDemoData(state: AppState): AppState {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const correspondentId = generateId();

  const correspondents: Correspondent[] = [
    {
      id: correspondentId,
      name: 'Eleanor',
      invitedAt: twoDaysAgo.toISOString(),
      note: 'I\'d like to write letters with you.',
    },
  ];

  const deliveryToday = new Date(now);
  deliveryToday.setHours(state.deliveryHour, state.deliveryMinute, 0, 0);

  const letters: Letter[] = [
    {
      id: generateId(),
      correspondentId,
      content: 'I\'ve been thinking about what you said last week, about how the best conversations happen when neither person is in a hurry. You were right. I walked through the park this morning and found myself composing this letter in my head before I even sat down to write it. There\'s something wonderful about that — knowing the words will wait.',
      writtenAt: twoDaysAgo.toISOString(),
      deliverAt: yesterday.toISOString(),
      deliveredAt: yesterday.toISOString(),
      sealedAt: twoDaysAgo.toISOString(),
      fromSelf: false,
      read: true,
    },
    {
      id: generateId(),
      correspondentId,
      content: 'You\'re right about the park. I went back yesterday and sat on that bench by the old oak — the one with the brass plaque we could never quite read. The light was doing that thing where it comes through the leaves in patches, and I thought: this is what a slow conversation feels like. Patches of light, with beautiful shadows between.',
      writtenAt: yesterday.toISOString(),
      deliverAt: deliveryToday.toISOString(),
      deliveredAt: deliveryToday.toISOString(),
      sealedAt: yesterday.toISOString(),
      fromSelf: true,
      read: true,
    },
    {
      id: generateId(),
      correspondentId,
      content: 'The brass plaque says "For Margaret, who loved Tuesdays." I finally got close enough to read it. Isn\'t that beautiful? Not Mondays, not weekends — Tuesdays. I want to be someone who loves a day that specific. Anyway, I made that soup recipe you mentioned. You were right to insist on fresh thyme. It changed everything.',
      writtenAt: yesterday.toISOString(),
      deliverAt: deliveryToday.toISOString(),
      sealedAt: yesterday.toISOString(),
      fromSelf: false,
      read: false,
    },
  ];

  return {
    ...state,
    correspondents,
    letters,
  };
}
