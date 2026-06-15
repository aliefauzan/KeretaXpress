'use client';

import React from 'react';
import { Notification } from '@/types/notification';
import { BsCheckCircle, BsXCircle, BsClock, BsExclamationCircle, BsBell } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  // Get icon and color based on notification type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'payment.completed':
      case 'booking.confirmed':
        return {
          icon: BsCheckCircle,
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
        };
      case 'payment.cancelled':
      case 'booking.cancelled':
        return {
          icon: BsXCircle,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
        };
      case 'payment.expired':
      case 'booking.expired':
        return {
          icon: BsClock,
          bgColor: 'bg-orange-50',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200',
        };
      case 'payment.pending':
        return {
          icon: BsExclamationCircle,
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
        };
      default:
        return {
          icon: BsBell,
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200',
        };
    }
  };

  const style = getNotificationStyle(notification.type);
  const Icon = style.icon;
  const isUnread = !notification.read_at;

  // Format time
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: idLocale,
  });

  return (
    <div
      onClick={() => onClick(notification)}
      className={`
        p-4 border-l-4 cursor-pointer transition-all duration-200
        hover:shadow-md
        ${style.borderColor}
        ${isUnread ? 'bg-white' : 'bg-gray-50'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-full ${style.bgColor}`}>
          <Icon className={`w-5 h-5 ${style.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold text-gray-900 ${isUnread ? 'font-bold' : ''}`}>
              {notification.data.title}
            </h4>
            {isUnread && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.data.message}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{timeAgo}</span>
            
            {notification.data.booking_code && (
              <>
                <span>•</span>
                <span className="font-mono font-medium text-gray-700">
                  {notification.data.booking_code}
                </span>
              </>
            )}

            {notification.data.triggered_by && (
              <>
                <span>•</span>
                <span className="capitalize">
                  {notification.data.triggered_by === 'admin' && notification.data.admin_email
                    ? `Admin: ${notification.data.admin_email}`
                    : notification.data.triggered_by}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
