import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { useQueueStore } from '@/store/useQueueStore';
import { useQuotaStore } from '@/store/useQuotaStore';
import { formatDate, formatDuration, calculateDuration } from '@/utils/time';
import { TimeSlot, Booking } from '@/types';

const BookingReschedulePage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id as string;

  const [selectedDate, setSelectedDate] = useState<string>(formatDate());
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const bookings = useQueueStore((s) => s.bookings);
  const rescheduleBooking = useQueueStore((s) => s.rescheduleBooking);
  const quotaPool = useQuotaStore((s) => s.quotaPool);

  const booking = useMemo<Booking | undefined>(
    () => bookings.find((b) => b.id === bookingId),
    [bookings, bookingId]
  );

  const totalMinutes = useMemo(() => {
    if (selectedSlots.length === 0) return 0;
    return selectedSlots.reduce((sum, slot) => sum + calculateDuration(slot.startTime, slot.endTime), 0);
  }, [selectedSlots]);

  const newQuota = Math.max(1, Math.ceil(totalMinutes / 60));
  const oldQuota = booking?.quotaUsed || 0;
  const diffQuota = newQuota - oldQuota;
  const canSubmit = selectedSlots.length > 0 && (diffQuota <= 0 || quotaPool.availableQuota >= diffQuota);

  const handleSlotsSelect = (slots: TimeSlot[]) => {
    setSelectedSlots(slots);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const handleConfirm = async () => {
    if (!booking || !canSubmit || loading) return;

    const sortedSlots = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const startTime = sortedSlots[0].startTime;
    const endTime = sortedSlots[sortedSlots.length - 1].endTime;

    setLoading(true);
    const result = await rescheduleBooking(booking.id, {
      date: selectedDate,
      startTime,
      endTime,
      duration: totalMinutes
    });
    setLoading(false);

    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } else {
      Taro.showToast({ title: result.message, icon: 'error' });
    }
  };

  if (!booking) {
    return <View className={styles.page}><Text>预约不存在</Text></View>;
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.currentCard}>
        <Text className={styles.cardTitle}>当前预约</Text>
        <Text className={styles.cardRoom}>{booking.roomName}</Text>
        <Text className={styles.cardTime}>
          {booking.date} {booking.startTime}-{booking.endTime}（{formatDuration(booking.duration)}）
        </Text>
        <Text className={styles.cardQuota}>已扣额度：{booking.quotaUsed} 小时</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择新的时段</Text>
        <TimeSlotPicker
          roomId={booking.roomId}
          value={selectedDate}
          onDateChange={setSelectedDate}
          multiSelect
          onSelect={handleSlotsSelect}
        />

        <View className={styles.tips}>
          <Text className={styles.tipsText}>请选择同琴房其他可用时段，改期后原时段自动释放</Text>
          <Text className={styles.tipsText}>若新时段更长需补扣额度，更短则退回差额</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>额度变化</Text>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>原预约时长</Text>
          <Text className={styles.summaryValue}>{formatDuration(booking.duration)}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>新预约时长</Text>
          <Text className={styles.summaryValue}>{totalMinutes > 0 ? formatDuration(totalMinutes) : '未选择'}</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>原扣额度</Text>
          <Text className={styles.summaryValue}>{oldQuota} 小时</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>新需额度</Text>
          <Text className={styles.summaryValue}>{totalMinutes > 0 ? `${newQuota} 小时` : '—'}</Text>
        </View>

        <View className={styles.diffRow}>
          <Text className={styles.diffLabel}>差额</Text>
          <View className={classnames(
            styles.diffValue,
            diffQuota > 0 && styles.plus,
            diffQuota < 0 && styles.minus,
            diffQuota === 0 && styles.zero
          )}>
            {diffQuota > 0 ? `+${diffQuota}` : diffQuota < 0 ? diffQuota : '0'}
            <Text className={styles.unit}>小时{diffQuota > 0 ? '（补扣）' : diffQuota < 0 ? '（退回）' : ''}</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button
          className={classnames(styles.confirmBtn, !canSubmit && styles.disabled)}
          disabled={!canSubmit || loading}
          onClick={handleConfirm}
        >
          {loading ? '提交中...' : '确认改期'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default BookingReschedulePage;
