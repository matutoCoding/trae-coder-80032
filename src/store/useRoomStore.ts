import { create } from 'zustand';
import { Room, TimeSlot } from '@/types';
import { mockRooms, getMockTimeSlots } from '@/data/rooms';
import { formatDate } from '@/utils/time';

interface RoomStore {
  rooms: Room[];
  timeSlots: Record<string, TimeSlot[]>;
  selectedRoom: Room | null;
  selectedDate: string;
  setSelectedRoom: (room: Room | null) => void;
  setSelectedDate: (date: string) => void;
  getTimeSlots: (roomId: string, date?: string) => TimeSlot[];
  updateRoomStatus: (roomId: string, status: Room['status']) => void;
  updateTimeSlotStatus: (roomId: string, slotId: string, status: TimeSlot['status']) => void;
  releaseExpiredBookings: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: mockRooms,
  timeSlots: {},
  selectedRoom: null,
  selectedDate: formatDate(),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  getTimeSlots: (roomId, date) => {
    const targetDate = date || get().selectedDate;
    const key = `${roomId}-${targetDate}`;
    const existing = get().timeSlots[key];
    if (existing) return existing;
    const slots = getMockTimeSlots(roomId, targetDate);
    set((state) => ({ timeSlots: { ...state.timeSlots, [key]: slots } }));
    return slots;
  },
  updateRoomStatus: (roomId, status) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, status } : r))
    })),
  updateTimeSlotStatus: (roomId, slotId, status) =>
    set((state) => {
      const targetDate = state.selectedDate;
      const key = `${roomId}-${targetDate}`;
      const slots = state.timeSlots[key] || [];
      const updatedSlots = slots.map((s) =>
        s.id === slotId ? { ...s, status } : s
      );
      return {
        timeSlots: { ...state.timeSlots, [key]: updatedSlots }
      };
    }),
  releaseExpiredBookings: () => {
    console.log('[RoomStore] Releasing expired bookings...');
    const now = new Date();
    set((state) => {
      const newTimeSlots = { ...state.timeSlots };
      Object.keys(newTimeSlots).forEach((key) => {
        newTimeSlots[key] = newTimeSlots[key].map((slot) => {
          if (slot.status === 'booked') {
            const [h, m] = slot.startTime.split(':').map(Number);
            const slotTime = new Date();
            slotTime.setHours(h, m, 0, 0);
            const diff = now.getTime() - slotTime.getTime();
            if (diff > 15 * 60 * 1000) {
              console.log(`[RoomStore] Released expired slot: ${slot.id}`);
              return { ...slot, status: 'expired' as const };
            }
          }
          return slot;
        });
      });
      return { timeSlots: newTimeSlots };
    });
  }
}));
