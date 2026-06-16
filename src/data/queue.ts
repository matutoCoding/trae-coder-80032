import { WaitlistItem } from '@/types';

export const mockWaitlist: WaitlistItem[] = [
  {
    id: 'wl-001',
    roomId: 'room-003',
    roomName: '卡哇伊琴房',
    userId: 'user-001',
    userName: '张小明',
    date: '2026-06-17',
    startTime: '19:00',
    endTime: '21:00',
    position: 1,
    status: 'waiting',
    createdAt: '2026-06-17 15:30',
    expiresAt: '2026-06-17 20:30'
  },
  {
    id: 'wl-002',
    roomId: 'room-003',
    roomName: '卡哇伊琴房',
    userId: 'user-002',
    userName: '李小红',
    date: '2026-06-17',
    startTime: '19:00',
    endTime: '20:00',
    position: 2,
    status: 'waiting',
    createdAt: '2026-06-17 15:45',
    expiresAt: '2026-06-17 20:30'
  },
  {
    id: 'wl-003',
    roomId: 'room-002',
    roomName: '雅马哈练习室',
    userId: 'user-003',
    userName: '张小乐',
    date: '2026-06-17',
    startTime: '20:00',
    endTime: '21:00',
    position: 1,
    status: 'notified',
    createdAt: '2026-06-17 14:00',
    notifiedAt: '2026-06-17 17:50',
    expiresAt: '2026-06-17 18:05'
  },
  {
    id: 'wl-004',
    roomId: 'room-005',
    roomName: '三角钢琴厅',
    userId: 'user-001',
    userName: '张小明',
    date: '2026-06-18',
    startTime: '10:00',
    endTime: '12:00',
    position: 3,
    status: 'waiting',
    createdAt: '2026-06-17 10:00',
    expiresAt: '2026-06-18 11:30'
  }
];
