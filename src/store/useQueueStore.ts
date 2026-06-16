import { create } from 'zustand';
import { WaitlistItem, Booking } from '@/types';
import { mockWaitlist } from '@/data/queue';
import { mockBookings } from '@/data/users';
import { formatDateTime, calculateDuration } from '@/utils/time';
import { useQuotaStore } from './useQuotaStore';
import { useRoomStore } from './useRoomStore';

interface QueueStore {
  waitlist: WaitlistItem[];
  bookings: Booking[];
  addToWaitlist: (item: Omit<WaitlistItem, 'id' | 'position' | 'status' | 'createdAt'>) => void;
  removeFromWaitlist: (id: string) => void;
  confirmWaitlist: (id: string) => Promise<{ success: boolean; message: string }>;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  cancelBooking: (id: string) => Promise<{ success: boolean; message: string }>;
  checkInBooking: (id: string) => void;
  processAutoRelease: () => void;
  notifyNextWaitlist: (roomId: string, date: string, startTime: string) => void;
}

const getStartOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

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
    if (!item) return { success: false, message: '候补记录不存在' };
    if (item.status !== 'notified') return { success: false, message: '候补状态异常，无法确认' };

    const durationMin = calculateDuration(item.startTime, item.endTime);
    const quotaAmount = Math.max(1, Math.ceil(durationMin / 60));

    const deductResult = await useQuotaStore.getState().deductQuota(
      quotaAmount,
      `候补补位${item.roomName}`,
      item.userId,
      item.userName
    );
    if (!deductResult) {
      return { success: false, message: '额度不足或扣减失败' };
    }

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      roomId: item.roomId,
      roomName: item.roomName,
      userId: item.userId,
      userName: item.userName,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      duration: durationMin,
      status: 'confirmed',
      quotaUsed: quotaAmount,
      createdAt: formatDateTime()
    };

    const startHour = parseInt(item.startTime.split(':')[0], 10);
    const endHour = parseInt(item.endTime.split(':')[0], 10);
    const updateTimeSlotStatus = useRoomStore.getState().updateTimeSlotStatus;
    for (let h = startHour; h < endHour; h++) {
      const slotId = `${item.roomId}-${item.date}-${h}`;
      updateTimeSlotStatus(item.roomId, slotId, 'booked');
    }

    set((state) => ({
      waitlist: state.waitlist.map((w) =>
        w.id === id ? { ...w, status: 'confirmed' as const } : w
      ),
      bookings: [newBooking, ...state.bookings]
    }));

    console.log('[Queue] Waitlist confirmed -> booking created:', newBooking.id, 'quotaUsed:', quotaAmount);
    return { success: true, message: '补位成功，已生成预约' };
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

  cancelBooking: async (id) => {
    const booking = get().bookings.find((b) => b.id === id);
    if (!booking) return { success: false, message: '预约不存在' };

    const refundResult = await useQuotaStore.getState().refundQuota(
      booking.quotaUsed,
      `取消预约${booking.roomName}`,
      booking.userId,
      booking.userName
    );
    if (!refundResult) {
      console.warn('[Queue] Refund failed during cancel, proceeding anyway');
    }

    const startHour = parseInt(booking.startTime.split(':')[0], 10);
    const endHour = parseInt(booking.endTime.split(':')[0], 10);
    const updateTimeSlotStatus = useRoomStore.getState().updateTimeSlotStatus;
    for (let h = startHour; h < endHour; h++) {
      const slotId = `${booking.roomId}-${booking.date}-${h}`;
      updateTimeSlotStatus(booking.roomId, slotId, 'available');
    }

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const } : b
      )
    }));

    get().notifyNextWaitlist(booking.roomId, booking.date, booking.startTime);
    console.log('[Queue] Booking cancelled & refunded:', id);
    return { success: true, message: '取消成功，额度已退回' };
  },

  checkInBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status: 'checkin' as const, checkInTime: formatDateTime() } : b
      )
    }));
    console.log('[Queue] Checked in (status=checkin / 练琴中):', id);
  },

  processAutoRelease: () => {
    console.log('[Queue] Processing auto-release (only today+15min overdue)...');
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startOfToday = getStartOfToday();

    const expiredBookingIds: string[] = [];

    set((state) => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.status !== 'confirmed') return b;

        if (b.date !== todayStr) return b;

        const [h, m] = b.startTime.split(':').map(Number);
        const startMs = startOfToday.getTime() + h * 3600 * 1000 + m * 60 * 1000;
        const diffMs = now.getTime() - startMs;

        if (diffMs > 15 * 60 * 1000) {
          expiredBookingIds.push(b.id);
          return { ...b, status: 'expired' as const };
        }
        return b;
      });

      return { bookings: updatedBookings };
    });

    if (expiredBookingIds.length > 0) {
      console.log(`[Queue] Auto-released ${expiredBookingIds.length} expired bookings:`, expiredBookingIds);
      expiredBookingIds.forEach((bid) => {
        const booking = get().bookings.find((b) => b.id === bid);
        if (booking) {
          useQuotaStore.getState().refundQuota(
            booking.quotaUsed,
            `超时释放${booking.roomName}`,
            booking.userId,
            booking.userName
          );

          const startHour = parseInt(booking.startTime.split(':')[0], 10);
          const endHour = parseInt(booking.endTime.split(':')[0], 10);
          const updateTimeSlotStatus = useRoomStore.getState().updateTimeSlotStatus;
          for (let h = startHour; h < endHour; h++) {
            const slotId = `${booking.roomId}-${booking.date}-${h}`;
            updateTimeSlotStatus(booking.roomId, slotId, 'available');
          }

          get().notifyNextWaitlist(booking.roomId, booking.date, booking.startTime);
        }
      });
    }
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
      console.log(
        '[Queue] Notified next waitlist (same room/date/slot):',
        nextInLine.id,
        nextInLine.userName,
        `room=${roomId} date=${date} slot=${startTime}`
      );
    }
  }
}));
