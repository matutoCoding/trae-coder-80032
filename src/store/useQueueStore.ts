import { create } from 'zustand';
import { WaitlistItem, Booking } from '@/types';
import { mockWaitlist } from '@/data/queue';
import { mockBookings } from '@/data/users';
import { formatDateTime } from '@/utils/time';

interface QueueStore {
  waitlist: WaitlistItem[];
  bookings: Booking[];
  addToWaitlist: (item: Omit<WaitlistItem, 'id' | 'position' | 'status' | 'createdAt'>) => void;
  removeFromWaitlist: (id: string) => void;
  confirmWaitlist: (id: string) => Promise<boolean>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  cancelBooking: (id: string) => void;
  checkInBooking: (id: string) => void;
  processAutoRelease: () => void;
  notifyNextWaitlist: (roomId: string, date: string, startTime: string) => void;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  waitlist: mockWaitlist,
  bookings: mockBookings,

  addToWaitlist: (item) => {
    const position = get().waitlist.filter(
      (w) => w.roomId === item.roomId && w.date === item.date && w.startTime === item.startTime && w.status === 'waiting'
    ).length + 1;

    const newItem: WaitlistItem = {
      ...item,
      id: `wl-${Date.now()}`,
      position,
      status: 'waiting',
      createdAt: formatDateTime()
    };

    set((state) => ({ waitlist: [...state.waitlist, newItem] }));
    console.log('[Queue] Added to waitlist:', newItem.id, 'position:', position);
  },

  removeFromWaitlist: (id) => {
    set((state) => {
      const removed = state.waitlist.find((w) => w.id === id);
      if (!removed) return state;

      const updated = state.waitlist
        .filter((w) => w.id !== id)
        .map((w) => {
          if (
            w.roomId === removed.roomId &&
            w.date === removed.date &&
            w.startTime === removed.startTime &&
            w.status === 'waiting' &&
            w.position > removed.position
          ) {
            return { ...w, position: w.position - 1 };
          }
          return w;
        });

      return { waitlist: updated };
    });
    console.log('[Queue] Removed from waitlist:', id);
  },

  confirmWaitlist: async (id) => {
    const item = get().waitlist.find((w) => w.id === id);
    if (!item || item.status !== 'notified') return false;

    set((state) => ({
      waitlist: state.waitlist.map((w) =>
        w.id === id ? { ...w, status: 'confirmed' as const } : w
      )
    }));
    console.log('[Queue] Waitlist confirmed:', id);
    return true;
  },

  addBooking: (booking) => {
    const newBooking: Booking = {
      ...booking,
      id: `bk-${Date.now()}`,
      status: 'confirmed',
      createdAt: formatDateTime()
    };
    set((state) => ({ bookings: [newBooking, ...state.bookings] }));
    console.log('[Queue] Booking added:', newBooking.id);
  },

  cancelBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const } : b
      )
    }));
    const booking = get().bookings.find((b) => b.id === id);
    if (booking) {
      get().notifyNextWaitlist(booking.roomId, booking.date, booking.startTime);
    }
    console.log('[Queue] Booking cancelled:', id);
  },

  checkInBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'checkedIn' as const, checkInTime: formatDateTime() } : b
      )
    }));
    console.log('[Queue] Checked in:', id);
  },

  processAutoRelease: () => {
    console.log('[Queue] Processing auto-release...');
    const now = new Date();

    set((state) => {
      let releasedCount = 0;
      const updatedBookings = state.bookings.map((b) => {
        if (b.status === 'confirmed') {
          const [h, m] = b.startTime.split(':').map(Number);
          const startTime = new Date();
          startTime.setHours(h, m, 0, 0);
          const diff = now.getTime() - startTime.getTime();
          if (diff > 15 * 60 * 1000) {
            releasedCount++;
            get().notifyNextWaitlist(b.roomId, b.date, b.startTime);
            return { ...b, status: 'expired' as const };
          }
        }
        return b;
      });

      if (releasedCount > 0) {
        console.log(`[Queue] Released ${releasedCount} expired bookings`);
      }
      return { bookings: updatedBookings };
    });
  },

  notifyNextWaitlist: (roomId, date, startTime) => {
    const nextInLine = get().waitlist
      .filter(
        (w) =>
          w.roomId === roomId &&
          w.date === date &&
          w.startTime === startTime &&
          w.status === 'waiting'
      )
      .sort((a, b) => a.position - b.position)[0];

    if (nextInLine) {
      set((state) => ({
        waitlist: state.waitlist.map((w) =>
          w.id === nextInLine.id
            ? { ...w, status: 'notified' as const, notifiedAt: formatDateTime() }
            : w
        )
      }));
      console.log('[Queue] Notified next in waitlist:', nextInLine.id, nextInLine.userName);
    }
  }
}));
