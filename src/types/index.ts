export type RoomStatus = 'available' | 'occupied' | 'full' | 'pending' | 'maintenance';

export interface Room {
  id: string;
  name: string;
  number: string;
  type: 'grand' | 'upright' | 'digital';
  location: string;
  description: string;
  status: RoomStatus;
  image: string;
  capacity: number;
  currentOccupancy: number;
  features: string[];
  pricePerHour: number;
}

export interface TimeSlot {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'available' | 'booked' | 'occupied' | 'expired';
  bookedBy?: string;
  checkInTime?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checkin' | 'completed' | 'cancelled' | 'expired';

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: BookingStatus;
  quotaUsed: number;
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface WaitlistItem {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  position: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'cancelled' | 'expired';
  createdAt: string;
  notifiedAt?: string;
  expiresAt?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  relation: string;
  phone: string;
  isOwner?: boolean;
  totalPracticeHours: number;
  monthPracticeHours: number;
  joinDate: string;
}

export interface QuotaTransaction {
  id: string;
  type: 'recharge' | 'consume' | 'refund' | 'transfer';
  amount: number;
  balanceAfter: number;
  description: string;
  operator: string;
  userId?: string;
  userName?: string;
  bookingId?: string;
  waitlistId?: string;
  createdAt: string;
}

export interface QuotaPool {
  familyId: string;
  totalQuota: number;
  usedQuota: number;
  availableQuota: number;
  lockVersion: number;
  updatedAt: string;
}

export interface PracticeRecord {
  id: string;
  userId: string;
  userName: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  durationMinutes: number;
  status: BookingStatus;
  quotaUsed: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  familyId: string;
  role: 'owner' | 'admin' | 'member';
  totalPracticeHours: number;
  monthPracticeHours: number;
  weekPracticeHours: number;
}
