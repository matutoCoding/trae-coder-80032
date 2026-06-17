import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import { getPracticeRecords, getMyBookings } from '@/services/bookingService';
import { formatDuration } from '@/utils/time';
import { getBookingStatusText } from '@/utils/format';
import { PracticeRecord, Booking } from '@/types';

const RecordsPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
  });

  const allBookings = useMemo(() => getMyBookings(), [refreshKey]);

  const totalMinutes = allBookings.reduce((sum, b) => {
    if (b.status === 'completed' || b.status === 'checkin') {
      return sum + b.duration;
    }
    return sum;
  }, 0);
  const totalSessions = allBookings.filter((b) => b.status !== 'cancelled' && b.status !== 'expired').length;
  const completedSessions = allBookings.filter((b) => b.status === 'completed').length;

  const handleBookRoom = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statsRow}>
        <StatCard
          variant='blue'
          title='累计练琴'
          value={`${(totalMinutes / 60).toFixed(1)}`}
          unit='小时'
          grow
        />
        <StatCard
          variant='orange'
          title='完成次数'
          value={`${completedSessions}`}
          unit='次'
          grow
        />
        <StatCard
          variant='green'
          title='本月次数'
          value={`${totalSessions}`}
          unit='次'
          grow
        />
      </View>

      {allBookings.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📝</Text>
          <Text className={styles.emptyText}>暂无练琴记录</Text>
          <Button className={styles.emptyBtn} onClick={handleBookRoom}>
            去预约琴房
          </Button>
        </View>
      ) : (
        allBookings.map((booking: Booking) => (
          <View key={booking.id} className={styles.recordItem}>
            <View className={classnames(styles.recordIcon, styles[booking.status])}>
              {booking.status === 'completed' && '✓'}
              {booking.status === 'confirmed' && '⏰'}
              {booking.status === 'checkin' && '🎹'}
              {booking.status === 'pending' && '🕐'}
              {booking.status === 'expired' && '✕'}
              {booking.status === 'cancelled' && '—'}
            </View>
            <View className={styles.recordContent}>
              <View className={styles.recordHeader}>
                <Text className={styles.recordRoom}>{booking.roomName}</Text>
                <View className={classnames(styles.recordStatus, styles[booking.status])}>
                  <Text>{getBookingStatusText(booking.status)}</Text>
                </View>
              </View>
              <Text className={styles.recordTime}>
                {booking.date} {booking.startTime}-{booking.endTime}
              </Text>
              <View className={styles.recordMeta}>
                <Text className={styles.recordUser}>{booking.userName}</Text>
                <Text className={styles.recordQuota}>-{booking.quotaUsed}额度</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default RecordsPage;
