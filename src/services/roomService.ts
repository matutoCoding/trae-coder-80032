import { Room, TimeSlot } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';

export const getRooms = (): Room[] => {
  return useRoomStore.getState().rooms;
};

export const getRoomById = (id: string): Room | undefined => {
  return useRoomStore.getState().rooms.find((r) => r.id === id);
};

export const getRoomsByStatus = (status: Room['status']): Room[] => {
  return useRoomStore.getState().rooms.filter((r) => r.status === status);
};

export const getAvailableRoomsCount = (): number => {
  return useRoomStore.getState().rooms.filter((r) => r.status === 'available').length;
};

export const getTimeSlots = (roomId: string, date?: string): TimeSlot[] => {
  return useRoomStore.getState().getTimeSlots(roomId, date);
};

export const updateRoomStatus = (roomId: string, status: Room['status']): void => {
  useRoomStore.getState().updateRoomStatus(roomId, status);
};

export const releaseExpiredBookings = (): void => {
  useRoomStore.getState().releaseExpiredBookings();
};
