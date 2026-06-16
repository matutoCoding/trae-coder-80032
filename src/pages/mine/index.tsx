import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatCard from '@/components/StatCard';
import { useUserStore } from '@/store/useUserStore';
import { useQueueStore } from '@/store/useQueueStore';
import { useQuotaStore } from '@/store/useQuotaStore';
import { getRoleText, getBookingStatusText } from '@/utils/format';
import { cancelUserBooking, checkIn } from '@/services/bookingService';
import { Booking } from '@/types';

const MinePage: React.FC = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const bookings = useQueueStore((s) => s.bookings);
  const processAutoRelease = useQueueStore((s) => s.processAutoRelease);
  const quotaPool = useQuotaStore((s) => s.quotaPool);

  useDidShow(() => {
    processAutoRelease();
    console.log('[MinePage] Page shown');
  });

  const onPullDownRefresh = () => {
    processAutoRelease();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const myUpcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => b.userId === currentUser.id && ['confirmed', 'pending', 'checkin'].includes(b.status))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 3);
  }, [bookings, currentUser.id]);

  const menuItems = [
    {
      group: '我的服务',
      items: [
        { icon: '📅', iconClass: 'booking', text: '预约记录', action: () => Taro.navigateTo({ url: '/pages/records/index' }) },
        { icon: '📊', iconClass: 'record', text: '练琴统计', action: () => Taro.navigateTo({ url: '/pages/records/index' }) },
        { icon: '👨‍👩‍👧‍👦', iconClass: 'family', text: '家庭成员', action: () => Taro.navigateTo({ url: '/pages/family-members/index' }) },
        { icon: '💰', iconClass: 'quota', text: '额度充值', action: () => Taro.switchTab({ url: '/pages/quota/index' }) }
      ]
    },
    {
      group: '其他',
      items: [
        { icon: '❓', iconClass: 'help', text: '帮助中心', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
        { icon: 'ℹ️', iconClass: 'about', text: '关于我们', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) }
      ]
    }
  ];

  const handleCheckIn = (booking: Booking) => {
    checkIn(booking.id);
  };

  const handleCancel = async (booking: Booking) => {
    Taro.showModal({
      title: '确认取消',
      content: `确定要取消 ${booking.roomName} 的预约吗？`,
      success: async (res) => {
        if (res.confirm) {
          await cancelUserBooking(booking);
        }
      }
    });
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      onPullDownRefresh={onPullDownRefresh}
      refresherEnabled
    >
      <View className={styles.userHeader}>
        <View className={styles.userInfo}>
          <Image className={styles.userAvatar} src={currentUser.avatar} mode='aspectFill' />
          <View className={styles.userDetail}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <View className={styles.userRole}>{getRoleText(currentUser.role)}</View>
          </View>
        </View>
      </View>

      <View className={styles.statsRow}>
        <StatCard value={currentUser.totalPracticeHours} label='累计练琴(h)' variant='primary' />
        <StatCard value={currentUser.monthPracticeHours} label='本月练琴(h)' variant='success' />
        <StatCard value={quotaPool.availableQuota} label='剩余额度(h)' variant='warning' />
      </View>

      {myUpcomingBookings.length > 0 && (
        <View className={styles.upcomingSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>即将开始</Text>
            <Text className={styles.sectionMore} onClick={() => Taro.navigateTo({ url: '/pages/records/index' })}>
              全部
            </Text>
          </View>
          {myUpcomingBookings.map((booking) => (
            <View key={booking.id} className={styles.bookingCard}>
              <View className={styles.bookingHeader}>
                <Text className={styles.bookingRoom}>{booking.roomName}</Text>
                <View className={classnames(styles.bookingStatus, styles[booking.status])}>
                  {getBookingStatusText(booking.status)}
                </View>
              </View>
              <Text className={styles.bookingTime}>
                {booking.date} {booking.startTime} - {booking.endTime}
              </Text>
              <Text className={styles.bookingMeta}>
                时长 {booking.duration} 分钟 · 消耗 {booking.quotaUsed} 额度
              </Text>
              <View className={styles.bookingActions}>
                {booking.status === 'confirmed' && (
                  <>
                    <Button
                      className={classnames(styles.bookingBtn, styles.primary)}
                      onClick={() => handleCheckIn(booking)}
                    >
                      签到
                    </Button>
                    <Button
                      className={classnames(styles.bookingBtn, styles.secondary)}
                      onClick={() => handleCancel(booking)}
                    >
                      取消预约
                    </Button>
                  </>
                )}
                {booking.status === 'checkin' && (
                  <Button className={classnames(styles.bookingBtn, styles.checkin)} disabled>
                    练琴中
                  </Button>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {menuItems.map((group) => (
        <View key={group.group} className={styles.menuSection}>
          <Text className={styles.menuTitle}>{group.group}</Text>
          {group.items.map((item, index) => (
            <View key={index} className={styles.menuItem} onClick={item.action}>
              <View className={classnames(styles.menuIcon, styles[item.iconClass])}>{item.icon}</View>
              <Text className={styles.menuText}>{item.text}</Text>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default MinePage;
