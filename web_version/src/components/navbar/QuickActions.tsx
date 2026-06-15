'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { FiSearch, FiCalendar, FiBell } from 'react-icons/fi';

interface QuickActionsProps {
  isScrolled: boolean;
  isLoggedIn: boolean;
  notifications: number;
  onSearchClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  isNotificationOpen?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  isScrolled,
  isLoggedIn,
  notifications,
  onSearchClick,
  onHistoryClick,
  onNotificationsClick,
  isNotificationOpen = false
}) => {
  const pathname = usePathname();

  const getButtonClass = (isActive: boolean) => {
    const base = "p-2 rounded-lg transition-all duration-300";
    const activeState = "scale-125 shadow-sm";
    const hoverState = "hover:scale-110";
    
    let colors = "";
    if (isScrolled) {
       if (isActive) colors = "text-blue-600 bg-blue-50";
       else colors = "text-gray-600 hover:text-blue-600 hover:bg-blue-50";
    } else {
       if (isActive) colors = "text-white bg-white/20 backdrop-blur-sm";
       else colors = "text-white hover:bg-white/20";
    }
    
    return `${base} ${isActive ? activeState : hoverState} ${colors}`;
  };

  return (
    <div className="hidden sm:flex items-center gap-2">
      <button
        onClick={onSearchClick}
        className={getButtonClass(pathname === '/schedule')}
        aria-label="Search trains"
      >
        <FiSearch className="w-5 h-5" />
      </button>
      
      <button
        onClick={onHistoryClick}
        className={getButtonClass(pathname === '/booking-history')}
        aria-label="Booking history"
      >
        <FiCalendar className="w-5 h-5" />
      </button>

      {/* Notifications (only if logged in) */}
      {isLoggedIn && (
        <button
          onClick={onNotificationsClick}
          className={`relative ${getButtonClass(isNotificationOpen)}`}
          aria-label="Notifications"
        >
          <FiBell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {notifications}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default QuickActions;
