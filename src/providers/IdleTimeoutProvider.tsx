import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from "react";
import { tokenUtils } from "../api";
import useUser from "../hooks/useUser";

interface IdleTimeoutContextType {
  lastActivity: number;
  resetActivity: () => void;
  timeRemaining: number;
}

const IdleTimeoutContext = createContext<IdleTimeoutContextType | null>(null);

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number;
  showWarning?: boolean;
  warningMinutes?: number;
  onIdle?: () => void;
}

export const IdleTimeoutProvider: React.FC<IdleTimeoutProviderProps> = ({
  children,
  timeoutMinutes = 2880,
  showWarning = true,
  warningMinutes = 0.5,
  onIdle,
}) => {
  const { user, clearUser } = useUser();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(timeoutMinutes * 60);
  const [showWarningDialog, setShowWarningDialog] = useState<boolean>(false);

  const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel", "keydown"];

  const handleLogout = useCallback(() => {
    console.log("User idle timeout - logging out");

    // Clear user data and tokens
    clearUser();
    if (tokenUtils?.forceLogout) {
      tokenUtils.forceLogout();
    }

    // Hide warning dialog
    setShowWarningDialog(false);

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
      setTimeRemaining(timeoutMinutes * 60);
      setShowWarningDialog(false);

      // Set new timeout
      timeoutRef.current = setTimeout(
        () => {
          handleLogout();
        },
        timeoutMinutes * 60 * 1000
      );
    }
  }, [user, timeoutMinutes, handleLogout]);

  const handleActivity = useCallback(() => {
    // Only reset if user is logged in
    if (user) {
      resetTimeout();
    }
  }, [user, resetTimeout]);

  // Update time remaining every second
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, timeoutMinutes * 60 - elapsed);

      setTimeRemaining(remaining);

      // Show warning dialog when approaching timeout
      if (showWarning && remaining <= warningMinutes * 60 && remaining > 0 && !showWarningDialog) {
        setShowWarningDialog(true);
      }

      // Auto-logout when time is up
      if (remaining === 0) {
        handleLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, timeoutMinutes, warningMinutes, showWarning, showWarningDialog, handleLogout]);

  // Set up event listeners
  useEffect(() => {
    // Only start tracking if user is logged in
    if (!user) {
      // Clear timeout if user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowWarningDialog(false);
      return;
    }

    // Initial timeout setup
    resetTimeout();

    // Add event listeners for activity tracking
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, handleActivity, resetTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contextValue: IdleTimeoutContextType = {
    lastActivity: lastActivityRef.current,
    resetActivity: handleActivity,
    timeRemaining,
  };

  return (
    <IdleTimeoutContext.Provider value={contextValue}>
      {children}

      {/* Warning Dialog - No buttons, disappears on activity */}
      {showWarningDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
              maxWidth: "400px",
              margin: "20px",
            }}
          >
            <h3 style={{ color: "#d32f2f", marginBottom: "15px" }}>⚠️ Session Timeout Warning</h3>
            <p style={{ marginBottom: "15px", color: "#666", fontSize: "16px" }}>
              Your session will expire in{" "}
              <strong>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
              </strong>{" "}
              due to inactivity.
            </p>
            <p style={{ marginBottom: "0", color: "#888", fontSize: "14px" }}>
              Move your mouse or interact with the page to continue your session.
            </p>
          </div>
        </div>
      )}
    </IdleTimeoutContext.Provider>
  );
};

export const useIdleTimeoutContext = (): IdleTimeoutContextType => {
  const context = useContext(IdleTimeoutContext);
  if (!context) {
    throw new Error("useIdleTimeoutContext must be used within an IdleTimeoutProvider");
  }
  return context;
};
