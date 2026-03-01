import { useState, useEffect } from 'react';
import { addHours, isAfter, parseISO } from 'date-fns';

const MAX_MESSAGES = 5;
const COOLDOWN_HOURS = 12;

interface UsageState {
  count: number;
  lastMessageTime: string | null; // ISO string
  blockedUntil: string | null; // ISO string
}

export function useUsageLimit() {
  const [usage, setUsage] = useState<UsageState>(() => {
    const stored = localStorage.getItem('ai_web_builder_usage');
    if (stored) {
      return JSON.parse(stored);
    }
    return { count: 0, lastMessageTime: null, blockedUntil: null };
  });

  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    localStorage.setItem('ai_web_builder_usage', JSON.stringify(usage));
    
    // Check if blocked
    if (usage.blockedUntil) {
      const blockedUntilDate = parseISO(usage.blockedUntil);
      if (isAfter(new Date(), blockedUntilDate)) {
        // Cooldown over
        setUsage({ count: 0, lastMessageTime: null, blockedUntil: null });
        setIsBlocked(false);
      } else {
        setIsBlocked(true);
      }
    } else {
      // Check if count >= MAX_MESSAGES
      // But wait, the prompt says "if passed 5 messages... wait 12 hours".
      // This implies the block starts *after* the 5th message.
      if (usage.count >= MAX_MESSAGES) {
        // If we just hit the limit, set the block time
        if (!usage.blockedUntil) {
            const blockTime = addHours(new Date(), COOLDOWN_HOURS).toISOString();
            setUsage(prev => ({ ...prev, blockedUntil: blockTime }));
            setIsBlocked(true);
        }
      } else {
        setIsBlocked(false);
      }
    }
  }, [usage]);

  const incrementUsage = () => {
    if (isBlocked) return false;
    
    setUsage(prev => ({
      ...prev,
      count: prev.count + 1,
      lastMessageTime: new Date().toISOString()
    }));
    return true;
  };

  return {
    usage,
    isBlocked,
    incrementUsage,
    remainingMessages: Math.max(0, MAX_MESSAGES - usage.count)
  };
}
