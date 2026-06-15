// Notification types for KeretaXpress

export type NotificationType = 
  | 'payment.completed'
  | 'payment.cancelled'
  | 'payment.expired'
  | 'payment.failed'
  | 'payment.pending'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.expired';

export type TriggeredBy = 'system' | 'admin' | 'customer' | 'midtrans';

export interface NotificationData {
  user_uuid: string;
  transaction_id: string;
  booking_code: string;
  title: string;
  message: string;
  triggered_by: TriggeredBy;
  admin_email?: string;
  admin_id?: string;
  reason?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  expired_at?: string;
  expiry_reason?: string;
  payment_method?: string;
  amount?: number;
  notes?: string;
  [key: string]: any;
}

export interface Notification {
  id: number;
  uuid: string;
  type: NotificationType;
  notifiable_type: 'booking' | 'payment';
  notifiable_id: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}
