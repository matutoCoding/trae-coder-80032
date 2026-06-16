import { User, FamilyMember, QuotaPool, QuotaTransaction, PracticeRecord, Booking } from '@/types';

export const familyCode = 'FAM-8X3K2P';

export const mockUser: User = {
  id: 'user-001',
  name: '张小明',
  avatar: 'https://picsum.photos/id/64/200/200',
  phone: '138****8888',
  familyId: 'family-001',
  role: 'owner',
  totalPracticeHours: 156,
  monthPracticeHours: 24,
  weekPracticeHours: 8
};

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'user-001',
    name: '张小明',
    avatar: 'https://picsum.photos/id/64/200/200',
    role: 'owner',
    relation: '本人',
    phone: '138****8888',
    isOwner: true,
    totalPracticeHours: 156,
    monthPracticeHours: 24,
    joinDate: '2024-01-15'
  },
  {
    id: 'user-002',
    name: '李小红',
    avatar: 'https://picsum.photos/id/91/200/200',
    role: 'admin',
    relation: '妻子',
    phone: '139****6666',
    totalPracticeHours: 89,
    monthPracticeHours: 12,
    joinDate: '2024-01-15'
  },
  {
    id: 'user-003',
    name: '张小乐',
    avatar: 'https://picsum.photos/id/177/200/200',
    role: 'member',
    relation: '儿子',
    phone: '137****5555',
    totalPracticeHours: 45,
    monthPracticeHours: 18,
    joinDate: '2024-02-20'
  },
  {
    id: 'user-004',
    name: '张小雨',
    avatar: 'https://picsum.photos/id/338/200/200',
    role: 'member',
    relation: '女儿',
    phone: '136****4444',
    totalPracticeHours: 32,
    monthPracticeHours: 10,
    joinDate: '2024-03-10'
  }
];

export const mockQuotaPool: QuotaPool = {
  familyId: 'family-001',
  totalQuota: 100,
  usedQuota: 64,
  availableQuota: 36,
  lockVersion: 1,
  updatedAt: new Date().toISOString()
};

export const mockQuotaTransactions: QuotaTransaction[] = [
  {
    id: 'tx-001',
    type: 'consume',
    amount: -2,
    balanceAfter: 36,
    description: '预约雅马哈练习室',
    operator: '张小明',
    userId: 'user-001',
    userName: '张小明',
    createdAt: '2026-06-17 14:30'
  },
  {
    id: 'tx-002',
    type: 'consume',
    amount: -1,
    balanceAfter: 38,
    description: '预约数字钢琴房',
    operator: '张小乐',
    userId: 'user-003',
    userName: '张小乐',
    createdAt: '2026-06-17 10:00'
  },
  {
    id: 'tx-003',
    type: 'refund',
    amount: 1,
    balanceAfter: 39,
    description: '取消预约卡哇伊琴房',
    operator: '系统',
    userId: 'user-002',
    userName: '李小红',
    createdAt: '2026-06-16 20:15'
  },
  {
    id: 'tx-004',
    type: 'recharge',
    amount: 50,
    balanceAfter: 38,
    description: '充值家庭共享额度',
    operator: '张小明',
    createdAt: '2026-06-15 09:00'
  },
  {
    id: 'tx-005',
    type: 'consume',
    amount: -3,
    balanceAfter: -12,
    description: '预约施坦威音乐厅',
    operator: '李小红',
    userId: 'user-002',
    userName: '李小红',
    createdAt: '2026-06-14 16:00'
  }
];

export const mockPracticeRecords: PracticeRecord[] = [
  {
    id: 'pr-001',
    userId: 'user-001',
    userName: '张小明',
    roomId: 'room-001',
    roomName: '施坦威音乐厅',
    date: '2026-06-17',
    startTime: '09:00',
    endTime: '11:00',
    duration: 120,
    durationMinutes: 120,
    status: 'completed',
    quotaUsed: 2
  },
  {
    id: 'pr-002',
    userId: 'user-003',
    userName: '张小乐',
    roomId: 'room-004',
    roomName: '数字钢琴房',
    date: '2026-06-17',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    durationMinutes: 60,
    status: 'checkin',
    quotaUsed: 1
  },
  {
    id: 'pr-003',
    userId: 'user-002',
    userName: '李小红',
    roomId: 'room-002',
    roomName: '雅马哈练习室',
    date: '2026-06-16',
    startTime: '19:00',
    endTime: '21:00',
    duration: 120,
    durationMinutes: 120,
    status: 'completed',
    quotaUsed: 2
  },
  {
    id: 'pr-004',
    userId: 'user-004',
    userName: '张小雨',
    roomId: 'room-006',
    roomName: '儿童启蒙室',
    date: '2026-06-16',
    startTime: '16:00',
    endTime: '17:30',
    duration: 90,
    durationMinutes: 90,
    status: 'completed',
    quotaUsed: 2
  },
  {
    id: 'pr-005',
    userId: 'user-001',
    userName: '张小明',
    roomId: 'room-005',
    roomName: '三角钢琴厅',
    date: '2026-06-15',
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    durationMinutes: 120,
    status: 'completed',
    quotaUsed: 3
  },
  {
    id: 'pr-006',
    userId: 'user-003',
    userName: '张小乐',
    roomId: 'room-003',
    roomName: '卡哇伊琴房',
    date: '2026-06-15',
    startTime: '15:00',
    endTime: '16:00',
    duration: 60,
    durationMinutes: 60,
    status: 'completed',
    quotaUsed: 1
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'bk-001',
    roomId: 'room-002',
    roomName: '雅马哈练习室',
    userId: 'user-001',
    userName: '张小明',
    date: '2026-06-17',
    startTime: '18:00',
    endTime: '20:00',
    duration: 120,
    status: 'confirmed',
    quotaUsed: 2,
    createdAt: '2026-06-16 20:00'
  },
  {
    id: 'bk-002',
    roomId: 'room-004',
    roomName: '数字钢琴房',
    userId: 'user-003',
    userName: '张小乐',
    date: '2026-06-18',
    startTime: '14:00',
    endTime: '15:00',
    duration: 60,
    status: 'pending',
    quotaUsed: 1,
    createdAt: '2026-06-17 09:30'
  },
  {
    id: 'bk-003',
    roomId: 'room-001',
    roomName: '施坦威音乐厅',
    userId: 'user-002',
    userName: '李小红',
    date: '2026-06-18',
    startTime: '09:00',
    endTime: '12:00',
    duration: 180,
    status: 'confirmed',
    quotaUsed: 3,
    createdAt: '2026-06-15 15:00'
  }
];
