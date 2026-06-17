import { RoomStatus } from '@/types';

export const getRoomStatusText = (status: RoomStatus): string => {
  const map: Record<RoomStatus, string> = {
    available: '空闲',
    occupied: '使用中',
    full: '已满',
    pending: '待释放',
    maintenance: '维护中'
  };
  return map[status];
};

export const getRoomTypeText = (type: string): string => {
  const map: Record<string, string> = {
    grand: '三角钢琴',
    upright: '立式钢琴',
    digital: '电钢琴'
  };
  return map[type] || type;
};

export const getBookingStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    checkin: '练琴中',
    completed: '已完成',
    cancelled: '已取消',
    expired: '已过期'
  };
  return map[status] || status;
};

export const getWaitlistStatusText = (status: string): string => {
  const map: Record<string, string> = {
    waiting: '排队中',
    notified: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    expired: '已过期'
  };
  return map[status] || status;
};

export const getTransactionTypeText = (type: string): string => {
  const map: Record<string, string> = {
    recharge: '充值',
    consume: '消费',
    refund: '退款',
    transfer: '转账'
  };
  return map[type] || type;
};

export const getRoleText = (role: string): string => {
  const map: Record<string, string> = {
    owner: '户主',
    admin: '管理员',
    member: '成员'
  };
  return map[role] || role;
};

export const maskPhone = (phone: string): string => {
  if (phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};
