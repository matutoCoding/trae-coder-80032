import Taro from '@tarojs/taro';
import { useQueueStore } from '@/store/useQueueStore';
import { useUserStore } from '@/store/useUserStore';
import { Booking, FamilyMember, PracticeRecord } from '@/types';
import { mockPracticeRecords as practiceRecords, familyCode } from '@/data/users';

export const createBooking = async (
  data: {
    roomId: string;
    roomName: string;
    userId: string;
    userName: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    quotaUsed: number;
  }
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[Booking Service] Creating booking:', data.roomName, data.date, data.startTime);
    const result = await useQueueStore.getState().createBooking(data as Omit<Booking, 'id' | 'status' | 'createdAt'>);
    if (result.success) {
      Taro.showToast({ title: '预约成功', icon: 'success' });
    }
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[Booking Service] Create booking failed:', err.message);
    return { success: false, message: err.message };
  }
};

export const cancelUserBooking = async (booking: Booking): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[Booking Service] Cancelling booking:', booking.id);
    const result = await useQueueStore.getState().cancelBooking(booking.id);
    if (result.success) {
      Taro.showToast({ title: '已取消预约', icon: 'success' });
    }
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[Booking Service] Cancel booking failed:', err.message);
    return { success: false, message: err.message };
  }
};

export const checkIn = (bookingId: string): void => {
  useQueueStore.getState().checkInBooking(bookingId);
  Taro.showToast({ title: '签到成功', icon: 'success' });
  console.log('[Booking Service] Checked in successfully:', bookingId);
};

export const getPracticeRecords = (): PracticeRecord[] => {
  return practiceRecords;
};

export const getMyBookings = (): Booking[] => {
  return useQueueStore.getState().bookings;
};

export const getFamilyMembers = (): FamilyMember[] => {
  return useUserStore.getState().allMembers;
};

export const getFamilyCode = (): string => {
  return familyCode;
};
