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

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const formatDateStr = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isBookingStartable = (booking: Booking): boolean => {
  const now = new Date();
  const todayStr = formatDateStr(now);
  if (booking.date < todayStr) return false;
  if (booking.date === todayStr) {
    const [h, m] = booking.startTime.split(':').map(Number);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startMs = startOfToday.getTime() + h * 3600 * 1000 + m * 60 * 1000;
    if (now.getTime() >= startMs) return false;
  }
  return true;
};

const MinePage: React.FC = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const allMembers = useUserStore((s) => s.allMembers);
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

  const weekSchedule = useMemo(() => {
    const days: Array<{
      date: string;
      dateStr: string;
      weekday: string;
      isToday: boolean;
      items: Array<Booking & { memberAvatar?: string }>;
    }> = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = formatDateStr(d);
      const items = bookings
        .filter((b) => b.date === dateStr && !['cancelled', 'expired'].includes(b.status))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((b) => {
          const m = allMembers.find((mem) => mem.id === b.userId);
          return { ...b, memberAvatar: m?.avatar };
        });
      days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        dateStr,
        weekday: WEEKDAY_NAMES[d.getDay()],
        isToday: i === 0,
        items
      });
    }
    return days;
  }, [bookings, allMembers]);

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

  const handleWeekItemClick = (booking: Booking) => {
    const canCancel = ['confirmed', 'pending'].includes(booking.status);
    const canReschedule = canCancel && isBookingStartable(booking);
    const canCheckIn = booking.status === 'confirmed';
    const itemList: string[] = [];
    const actions: Array<() => void> = [];
    if (canReschedule) {
      itemList.push('改期');
      actions.push(() => Taro.navigateTo({ url: `/pages/booking-reschedule/index?id=${booking.id}` }));
    }
    if (canCheckIn) {
      itemList.push('签到');
      actions.push(() => handleCheckIn(booking));
    }
    if (canCancel) {
      itemList.push('取消预约');
      actions.push(() => handleCancel(booking));
    }
    if (itemList.length === 0) {
      Taro.showToast({ title: '已开始或已完成，无可用操作', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList,
      success: (res) => {
        actions[res.tapIndex]?.();
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

      <View className={styles.weekSection}>
        <View className={styles.weekHeader}>
          <Text className={styles.weekTitle}>家庭周排期</Text>
          <Text className={styles.weekSub}>未来7天全家练琴计划</Text>
        </View>
        {weekSchedule.every((d) => d.items.length === 0) ? (
          <View className={styles.emptyWeek}>暂无预约，去首页约琴吧～</View>
        ) : (
          <View className={styles.dayGroups}>
            {weekSchedule.map((day) => (
              day.items.length === 0 ? null : (
                <View key={day.dateStr} className={styles.dayGroup}>
                  <View className={styles.dayLabel}>
                    <Text className={styles.dayDate}>
                      {day.date}
                      {day.isToday && '（今天）'}
                    </Text>
                    <Text className={styles.dayWeek}>{day.weekday}</Text>
                    <Text className={styles.dayCount}>{day.items.length}节</Text>
                  </View>
                  {day.items.map((booking) => (
                    <View
                      key={booking.id}
                      className={styles.bookingItem}
                      onClick={() => handleWeekItemClick(booking)}
                    >
                      <View className={styles.bookingTop}>
                        <View className={styles.bookingWho}>
                          {booking.memberAvatar && (
                            <Image className={styles.bookingWhoAvatar} src={booking.memberAvatar} mode='aspectFill' />
                          )}
                          <Text className={styles.bookingWhoName}>{booking.userName}</Text>
                        </View>
                        <View className={classnames(styles.bookingStatus, styles[booking.status])}>
                          {getBookingStatusText(booking.status)}
                        </View>
                      </View>
                      <Text className={styles.bookingWhen}>
                        {booking.startTime} - {booking.endTime}
                        <Text style={{ marginLeft: '12rpx', color: '#86909C', fontSize: '22rpx', fontWeight: 'normal' }}>
                          · 时长 {booking.duration}分
                        </Text>
                      </Text>
                      <Text className={styles.bookingRoom}>{booking.roomName}</Text>
                    </View>
                  ))}
                </View>
              )
            ))}
          </View>
        )}
      </View>

      {myUpcomingBookings.length > 0 && (
        <View className={styles.upcomingSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的即将开始</Text>
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
                {(booking.status === 'confirmed' || booking.status === 'pending') && isBookingStartable(booking) && (
                  <Button
                    className={classnames(styles.bookingBtn, styles.primary)}
                    onClick={() => Taro.navigateTo({ url: `/pages/booking-reschedule/index?id=${booking.id}` })}
                  >
                    改期
                  </Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    className={classnames(styles.bookingBtn, styles.checkin)}
                    onClick={() => handleCheckIn(booking)}
                  >
                    签到
                  </Button>
                )}
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <Button
                    className={classnames(styles.bookingBtn, styles.secondary)}
                    onClick={() => handleCancel(booking)}
                  >
                    取消
                  </Button>
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
