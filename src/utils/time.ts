export const formatDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (date: Date = new Date()): string => {
  const dateStr = formatDate(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};

export const getDateList = (days: number = 7): { date: string; weekday: string; day: string }[] => {
  const result = [];
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    result.push({
      date: formatDate(date),
      weekday: i === 0 ? '今天' : weekdays[date.getDay()],
      day: date.getDate().toString()
    });
  }
  return result;
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`;
  if (hours > 0) return `${hours}小时`;
  return `${mins}分钟`;
};

export const getTimeSlots = (startHour: number = 8, endHour: number = 22): { startTime: string; endTime: string }[] => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push({
      startTime: `${h.toString().padStart(2, '0')}:00`,
      endTime: `${(h + 1).toString().padStart(2, '0')}:00`
    });
  }
  return slots;
};
