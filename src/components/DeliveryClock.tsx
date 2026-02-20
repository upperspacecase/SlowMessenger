'use client';

import React, { useState, useEffect } from 'react';
import { formatDeliveryTime } from '@/lib/store';
import styles from './DeliveryClock.module.css';

interface DeliveryClockProps {
  deliveryHour: number;
  deliveryMinute: number;
  hasLetters: boolean;
}

export function DeliveryClock({ deliveryHour, deliveryMinute, hasLetters }: DeliveryClockProps) {
  const [timeUntil, setTimeUntil] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const delivery = new Date(now);
      delivery.setHours(deliveryHour, deliveryMinute, 0, 0);

      if (delivery <= now) {
        delivery.setDate(delivery.getDate() + 1);
      }

      const diff = delivery.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours === 0 && minutes <= 1) {
        setTimeUntil('any moment now');
      } else if (hours === 0) {
        setTimeUntil(`in ${minutes} minutes`);
      } else if (hours === 1 && minutes === 0) {
        setTimeUntil('in about an hour');
      } else if (hours < 2) {
        setTimeUntil(`in about an hour`);
      } else {
        setTimeUntil(`in ${hours} hours`);
      }
    }

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [deliveryHour, deliveryMinute]);

  return (
    <div className={`${styles.clock} ${hasLetters ? styles.clockAlive : ''}`}>
      <div className={styles.timeDisplay}>
        {formatDeliveryTime(deliveryHour, deliveryMinute)}
      </div>
      <div className={styles.label}>
        {hasLetters
          ? 'Letters are waiting'
          : `Next letters arrive ${timeUntil}`
        }
      </div>
      {hasLetters && <div className={styles.pulse} />}
    </div>
  );
}
