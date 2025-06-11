import React, { useState, useEffect } from 'react';
import { useIdleTimeoutContext } from '../providers/IdleTimeoutProvider';

interface IdleTimeoutIndicatorProps {
  showCountdown?: boolean;
  timeoutMinutes?: number;
  className?: string;
}

const IdleTimeoutIndicator: React.FC<IdleTimeoutIndicatorProps> = ({
  showCountdown = true,
  timeoutMinutes = 2880,
  className = ''
}) => {
  const { lastActivity } = useIdleTimeoutContext();
  const [timeRemaining, setTimeRemaining] = useState<number>(timeoutMinutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastActivity) / 1000);
      const remaining = Math.max(0, (timeoutMinutes * 60) - elapsed);
      
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeoutMinutes]);

  if (!showCountdown) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  // Show warning when less than 1 minute remaining
  const isWarning = timeRemaining <= 60;
  
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  };

  const warningStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: '2px solid #ff5252',
    animation: 'pulse 1s infinite',
  };

  const normalStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    border: '1px solid #dee2e6',
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      <div 
        className={className}
        style={isWarning ? warningStyle : normalStyle}
      >
        {isWarning && '⚠️ '}
        Session: {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </>
  );
};

export default IdleTimeoutIndicator;