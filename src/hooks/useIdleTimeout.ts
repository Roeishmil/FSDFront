import { useEffect, useRef, useCallback } from 'react';
import { tokenUtils } from '../api';
import useUser from './useUser';

interface UseIdleTimeoutOptions {
  timeout?: number; // timeout in milliseconds
  onIdle?: () => void; // callback when user becomes idle
  events?: string[]; // events to track for activity
}

const useIdleTimeout = ({
  timeout = 2 * 60 * 1000, // 2 minutes default
  onIdle,
  events = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'wheel',
    'keydown'
  ]
}: UseIdleTimeoutOptions = {}) => {
  const { user, clearUser } = useUser();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(() => {
    console.log('User idle timeout - logging out');
    
    // Clear user data and tokens
    clearUser();
    tokenUtils.forceLogout();
    
    // Call custom onIdle callback if provided
    if (onIdle) {
      onIdle();
    }
  }, [clearUser, onIdle]);

  const resetTimeout = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timeout if user is logged in
    if (user) {
      lastActivityRef.current = Date.now();
      
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, timeout);
    }
  }, [user, timeout, handleLogout]);

  const handleActivity = useCallback(() => {
    // Only reset if user is logged in
    if (user) {
      resetTimeout();
    }
  }, [user, resetTimeout]);

  useEffect(() => {
    // Only start tracking if user is logged in
    if (!user) {
      // Clear timeout if user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initial timeout setup
    resetTimeout();

    // Add event listeners for activity tracking
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, events, handleActivity, resetTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    lastActivity: lastActivityRef.current,
    resetTimeout: handleActivity, // Expose method to manually reset timeout
  };
};

export default useIdleTimeout;