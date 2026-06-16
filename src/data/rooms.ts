import { Room, TimeSlot } from '@/types';

export const mockRooms: Room[] = [
  {
    id: 'room-001',
    name: '施坦威音乐厅',
    number: 'A101',
    type: 'grand',
    location: 'A栋1楼',
    description: '配备施坦威三角钢琴，专业录音设备，适合演出录制和高级练习',
    status: 'available',
    image: 'https://picsum.photos/id/1082/750/500',
    capacity: 2,
    currentOccupancy: 0,
    features: ['三角钢琴', '专业录音', '隔音墙', '空调'],
    pricePerHour: 60
  },
  {
    id: 'room-002',
    name: '雅马哈练习室',
    number: 'A102',
    type: 'upright',
    location: 'A栋1楼',
    description: '雅马哈立式钢琴，标准练习配置，适合日常练习',
    status: 'occupied',
    image: 'https://picsum.photos/id/1060/750/500',
    capacity: 1,
    currentOccupancy: 1,
    features: ['立式钢琴', '隔音墙', '空调'],
    pricePerHour: 30
  },
  {
    id: 'room-003',
    name: '卡哇伊琴房',
    number: 'A201',
    type: 'upright',
    location: 'A栋2楼',
    description: '卡哇伊立式钢琴，安静舒适的练习环境',
    status: 'full',
    image: 'https://picsum.photos/id/201/750/500',
    capacity: 1,
    currentOccupancy: 1,
    features: ['立式钢琴', '隔音墙', '空调', '乐谱架'],
    pricePerHour: 25
  },
  {
    id: 'room-004',
    name: '数字钢琴房',
    number: 'B101',
    type: 'digital',
    location: 'B栋1楼',
    description: '罗兰高端电钢琴，可调节音量，支持耳机练习',
    status: 'available',
    image: 'https://picsum.photos/id/119/750/500',
    capacity: 2,
    currentOccupancy: 0,
    features: ['电钢琴', '耳机', 'MIDI接口', '空调'],
    pricePerHour: 20
  },
  {
    id: 'room-005',
    name: '三角钢琴厅',
    number: 'B201',
    type: 'grand',
    location: 'B栋2楼',
    description: '珠江三角钢琴，宽敞明亮，适合多人观摩',
    status: 'pending',
    image: 'https://picsum.photos/id/1080/750/500',
    capacity: 4,
    currentOccupancy: 0,
    features: ['三角钢琴', '观众座椅', '隔音墙', '空调'],
    pricePerHour: 50
  },
  {
    id: 'room-006',
    name: '儿童启蒙室',
    number: 'B202',
    type: 'digital',
    location: 'B栋2楼',
    description: '专为儿童设计，彩色装饰，安全防护',
    status: 'available',
    image: 'https://picsum.photos/id/103/750/500',
    capacity: 2,
    currentOccupancy: 0,
    features: ['电钢琴', '儿童座椅', '安全防护', '空调'],
    pricePerHour: 25
  }
];

const generateTimeSlots = (roomId: string, date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 8; hour < 22; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    const random = Math.random();
    let status: TimeSlot['status'] = 'available';
    if (random > 0.7) status = 'booked';
    else if (random > 0.6) status = 'occupied';

    slots.push({
      id: `${roomId}-${date}-${hour}`,
      roomId,
      startTime,
      endTime,
      date,
      status
    });
  }
  return slots;
};

export const getMockTimeSlots = (roomId: string, date: string): TimeSlot[] => {
  return generateTimeSlots(roomId, date);
};
