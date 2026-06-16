import { WaitlistItem, Booking } from '@/types';
import { useQueueStore } from '@/store/useQueueStore';

export const getWaitlist = (): WaitlistItem[] => {
  return useQueueStore.getState().waitlist;
};

export const getUserWaitlist = (userId: string): WaitlistItem[] => {
  return useQueueStore.getState().waitlist.filter((w) => w.userId === userId);
};

export const getBookings = (): Booking[] => {
  return useQueueStore.getState().bookings;
};

export const getUserBookings = (userId: string): Booking[] => {
  return useQueueStore.getState().bookings.filter((b) => b.userId === userId);
};

export const addToWaitlist = (
  item: Omit<WaitlistItem, 'id' | 'position' | 'status' | 'createdAt'>
): void => {
  useQueueStore.getState().addToWaitlist(item);
};

export const removeFromWaitlist = (id: string): void => {
  useQueueStore.getState().removeFromWaitlist(id);
};

export const confirmWaitlist = async (id: string): Promise<{ success: boolean; message: string }> => {
  return useQueueStore.getState().confirmWaitlist(id);
};

export const addBooking = (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): void => {
  useQueueStore.getState().addBooking(booking);
};

export const cancelBooking = (id: string): void => {
  useQueueStore.getState().cancelBooking(id);
};

export const checkInBooking = (id: string): void => {
  useQueueStore.getState().checkInBooking(id);
};

export const processAutoRelease = (): void => {
  useQueueStore.getState().processAutoRelease();
};

export const notifyNextWaitlist = (roomId: string, date: string, startTime: string): void => {
  useQueueStore.getState().notifyNextWaitlist(roomId, date, startTime);
};
