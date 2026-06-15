'use client';

import React from 'react';
import { BsBell } from 'react-icons/bs';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  count, 
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 ${className}`}
      aria-label="Notifications"
    >
      <BsBell className="w-5 h-5" />
      
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
