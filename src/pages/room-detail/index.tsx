import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { getRoomById } from '@/services/roomService';
import { addToWaitlist } from '@/services/queueService';
import { useUserStore } from '@/store/useUserStore';
import { useQuotaStore } from '@/store/useQuotaStore';
import { TimeSlot, Room } from '@/types';
import { getRoomStatusText, getRoomTypeText } from '@/utils/format';
import { formatDate, calculateDuration, formatDuration } from '@/utils/time';

const RoomDetailPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.id as string;

  const [room, setRoom] = useState<Room | undefined>();
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate());
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const currentUser = useUserStore((s) => s.currentUser);
  const quotaPool = useQuotaStore((s) => s.quotaPool);

  useEffect(() => {
    const found = getRoomById(roomId);
    setRoom(found);
  }, [roomId, refreshKey]);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
  });

  const totalMinutes = useMemo(() => {
    if (selectedSlots.length === 0) return 0;
    return selectedSlots.reduce((sum, slot) => sum + calculateDuration(slot.startTime, slot.endTime), 0);
  }, [selectedSlots]);

  const quotaNeeded = useMemo(() => {
    if (!room || totalMinutes === 0) return 0;
    return Math.ceil((totalMinutes / 60) * (room.pricePerHour / 30));
  }, [room, totalMinutes]);

  const handleSlotsSelect = (slots: TimeSlot[]) => {
    setSelectedSlots(slots);
  };

  const handleBook = () => {
    if (selectedSlots.length === 0) {
      Taro.showToast({ title: '请选择时间段', icon: 'none' });
      return;
    }

    if (quotaNeeded > quotaPool.availableQuota) {
      Taro.showToast({ title: '额度不足，请先充值', icon: 'none' });
      return;
    }

    const sortedSlots = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const startTime = sortedSlots[0].startTime;
    const endTime = sortedSlots[sortedSlots.length - 1].endTime;

    Taro.navigateTo({
      url: `/pages/booking-confirm/index?roomId=${roomId}&date=${selectedDate}&startTime=${startTime}&endTime=${endTime}&duration=${totalMinutes}&quota=${quotaNeeded}`
    });
  };

  const handleWaitlist = () => {
    if (selectedSlots.length === 0) {
      Taro.showToast({ title: '请选择要候补的时段', icon: 'none' });
      return;
    }

    const sortedSlots = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const startTime = sortedSlots[0].startTime;
    const endTime = sortedSlots[sortedSlots.length - 1].endTime;

    Taro.showModal({
      title: '加入候补',
      content: `确定候补 ${room?.name} ${selectedDate} ${startTime}-${endTime} 吗？`,
      success: (res) => {
        if (res.confirm) {
          addToWaitlist({
            roomId,
            roomName: room?.name || '',
            userId: currentUser.id,
            userName: currentUser.name,
            date: selectedDate,
            startTime,
            endTime
          });
          Taro.showToast({ title: '已加入候补', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/queue/index' });
          }, 1500);
        }
      }
    });
  };

  if (!room) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const canBook = room.status === 'available' || room.status === 'pending';
  const isFull = room.status === 'full' || room.status === 'occupied';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.roomHeader}>
        <Image className={styles.roomImage} src={room.image} mode='aspectFill' />
        <View className={classnames(styles.statusOverlay, styles[room.status])}>
          <Text className={styles.statusText}>{getRoomStatusText(room.status)}</Text>
        </View>
      </View>

      <View className={styles.roomInfo}>
        <View className={styles.roomTitle}>
          <Text className={styles.roomName}>{room.name}</Text>
          <Text className={styles.roomNumber}>{room.number}</Text>
        </View>
        <Text className={styles.roomLocation}>{room.location} · {getRoomTypeText(room.type)}</Text>
        <Text className={styles.roomDesc}>{room.description}</Text>
        <View className={styles.features}>
          {room.features.map((feature, index) => (
            <View key={index} className={styles.featureTag}>{feature}</View>
          ))}
        </View>
        <View className={styles.priceRow}>
          <Text className={styles.priceValue}>{room.pricePerHour}</Text>
          <Text className={styles.priceUnit}>/小时（30元=1额度）</Text>
        </View>
      </View>

      <View className={styles.quotaNotice}>
        <Text className={styles.noticeIcon}>💰</Text>
        <Text className={styles.noticeText}>
          家庭共享额度剩余 <Text className={styles.noticeHighlight}>{quotaPool.availableQuota}</Text> 小时
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择时间</Text>
        <TimeSlotPicker
          roomId={roomId}
          value={selectedDate}
          onDateChange={setSelectedDate}
          multiSelect
          onSelect={handleSlotsSelect}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.selectedInfo}>
          {selectedSlots.length > 0 ? (
            <>
              <Text className={styles.selectedLabel}>已选 {selectedSlots.length} 个时段</Text>
              <Text className={styles.selectedValue}>
                {formatDuration(totalMinutes)} · 消耗 {quotaNeeded} 额度
              </Text>
            </>
          ) : (
            <>
              <Text className={styles.selectedLabel}>请选择时间段</Text>
              <Text className={styles.selectedValue}>支持多选连续时段</Text>
            </>
          )}
        </View>
        <View className={styles.actionBtns}>
          {isFull && (
            <Button
              className={classnames(styles.actionBtn, styles.waitlist)}
              onClick={handleWaitlist}
            >
              候补排队
            </Button>
          )}
          <Button
            className={classnames(
              styles.actionBtn,
              styles.book,
              (selectedSlots.length === 0 || !canBook) && styles.disabled
            )}
            disabled={selectedSlots.length === 0 || !canBook}
            onClick={handleBook}
          >
            {canBook ? '立即预约' : '暂无可用'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default RoomDetailPage;
