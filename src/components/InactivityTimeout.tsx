'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function InactivityTimeout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't set up the timeout if we're on the home page
    if (pathname === '/') {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // 10 minutes = 10 * 60 * 1000 milliseconds
      timeoutId = setTimeout(
        () => {
          router.push('/');
        },
        10 * 60 * 1000
      );
    };

    // Set up event listeners for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initial setup of the timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, router]);

  return null;
}
