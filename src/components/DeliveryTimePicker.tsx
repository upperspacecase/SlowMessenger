'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { formatDeliveryTime } from '@/lib/store';
import styles from './DeliveryTimePicker.module.css';

interface DeliveryTimePickerProps {
  initialHour?: number;
  initialMinute?: number;
  onSelect: (hour: number, minute: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DeliveryTimePicker({ initialHour = 8, initialMinute = 0, onSelect }: DeliveryTimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 56;

  // Scroll to initial position
  useEffect(() => {
    if (scrollRef.current) {
      const targetScroll = initialHour * itemHeight;
      scrollRef.current.scrollTop = targetScroll;
    }
  }, [initialHour]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, 23));

    if (clampedIndex !== selectedHour) {
      setSelectedHour(clampedIndex);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
  }, [selectedHour]);

  const handleConfirm = useCallback(() => {
    onSelect(selectedHour, selectedMinute);
  }, [selectedHour, selectedMinute, onSelect]);

  return (
    <div className={styles.picker}>
      <div className={styles.dialContainer}>
        {/* Selection indicator */}
        <div className={styles.selectionWindow} />

        {/* Scrollable hour list */}
        <div
          ref={scrollRef}
          className={styles.scrollArea}
          onScroll={handleScroll}
        >
          {/* Top padding for centering */}
          <div style={{ height: itemHeight * 2 }} />

          {HOURS.map((hour) => {
            const isSelected = hour === selectedHour;
            return (
              <div
                key={hour}
                className={`${styles.hourItem} ${isSelected ? styles.hourItemActive : ''}`}
                style={{ height: itemHeight }}
                onClick={() => {
                  setSelectedHour(hour);
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                      top: hour * itemHeight,
                      behavior: 'smooth',
                    });
                  }
                }}
              >
                {formatDeliveryTime(hour, selectedMinute)}
              </div>
            );
          })}

          {/* Bottom padding for centering */}
          <div style={{ height: itemHeight * 2 }} />
        </div>
      </div>

      {/* Minute toggle */}
      <div className={styles.minuteToggle}>
        <button
          className={`${styles.minuteOption} ${selectedMinute === 0 ? styles.minuteOptionActive : ''}`}
          onClick={() => setSelectedMinute(0)}
        >
          On the hour
        </button>
        <button
          className={`${styles.minuteOption} ${selectedMinute === 30 ? styles.minuteOptionActive : ''}`}
          onClick={() => setSelectedMinute(30)}
        >
          Half past
        </button>
      </div>

      {/* Confirm */}
      <button className={styles.confirmButton} onClick={handleConfirm}>
        Choose {formatDeliveryTime(selectedHour, selectedMinute)}
      </button>
    </div>
  );
}
