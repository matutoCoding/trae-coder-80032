import Taro from '@tarojs/taro';
import { deductQuota, refundQuota } from './quotaService';
import { addBooking, cancelBooking, checkInBooking } from './queueService';
import { Booking, FamilyMember, PracticeRecord } from '@/types';
import { useQueueStore } from '@/store/useQueueStore';
import { useUserStore } from '@/store/useUserStore';
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
    console.log('[Booking] Creating booking:', data);

    const quotaSuccess = await deductQuota(
      data.quotaUsed,
      `预约${data.roomName}`,
      data.userId,
      data.userName
    );

    if (!quotaSuccess) {
      console.error('[Booking] Failed to deduct quota');
      return { success: false, message: '额度扣减失败，请检查余额' };
    }

    addBooking(data);

    Taro.showToast({ title: '预约成功', icon: 'success' });
    console.log('[Booking] Booking created successfully');
    return { success: true, message: '预约成功' };
  } catch (error) {
    const err = error as Error;
    console.error('[Booking] Create booking failed:', err.message);
    return { success: false, message: err.message };
  }
};

export const cancelUserBooking = async (booking: Booking): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[Booking] Cancelling booking:', booking.id);

    cancelBooking(booking.id);

    await refundQuota(
      booking.quotaUsed,
      `取消预约${booking.roomName}`,
      booking.userId,
      booking.userName
    );

    Taro.showToast({ title: '已取消预约', icon: 'success' });
    console.log('[Booking] Booking cancelled successfully');
    return { success: true, message: '取消成功' };
  } catch (error) {
    const err = error as Error;
    console.error('[Booking] Cancel booking failed:', err.message);
    return { success: false, message: err.message };
  }
};

export const checkIn = (bookingId: string): void => {
  checkInBooking(bookingId);
  Taro.showToast({ title: '签到成功', icon: 'success' });
  console.log('[Booking] Checked in successfully:', bookingId);
};

export const getPracticeRecords = (): PracticeRecord[] => {
  return practiceRecords;
};

export const getMyBookings = (): Booking[] => {
  return useQueueStore.getState().bookings;
};

export const getFamilyMembers = (): FamilyMember[] => {
  return useUserStore.getState().familyMembers;
};

export const getFamilyCode = (): string => {
  return familyCode;
};
