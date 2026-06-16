import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import RoomCard from '@/components/RoomCard';
import StatCard from '@/components/StatCard';
import { useUserStore } from '@/store/useUserStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useQuotaStore } from '@/store/useQuotaStore';
import { useQueueStore } from '@/store/useQueueStore';
import { getAvailableRoomsCount } from '@/services/roomService';
import { Room } from '@/types';

const HomePage: React.FC = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const rooms = useRoomStore((s) => s.rooms);
  const quotaPool = useQuotaStore((s) => s.quotaPool);
  const waitlist = useQueueStore((s) => s.waitlist);
  const processAutoRelease = useQueueStore((s) => s.processAutoRelease);
  const releaseExpiredBookings = useRoomStore((s) => s.releaseExpiredBookings);

  const [filter, setFilter] = useState<string>('all');
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(rooms);

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'available', label: '空闲' },
    { key: 'grand', label: '三角钢琴' },
    { key: 'upright', label: '立式钢琴' },
    { key: 'digital', label: '电钢琴' }
  ];

  const applyFilter = useCallback(() => {
    let result = [...rooms];
    if (filter === 'available') {
      result = result.filter((r) => r.status === 'available');
    } else if (['grand', 'upright', 'digital'].includes(filter)) {
      result = result.filter((r) => r.type === filter);
    }
    setFilteredRooms(result);
  }, [rooms, filter]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  useDidShow(() => {
    processAutoRelease();
    releaseExpiredBookings();
    applyFilter();
    console.log('[HomePage] Page shown, refreshed data');
  });

  const onPullDownRefresh = () => {
    processAutoRelease();
    releaseExpiredBookings();
    applyFilter();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const handleRecharge = () => {
    Taro.switchTab({ url: '/pages/quota/index' });
  };

  const handleViewRecords = () => {
    Taro.navigateTo({ url: '/pages/records/index' });
  };

  const myWaitlistCount = waitlist.filter((w) => w.userId === currentUser.id && w.status === 'waiting').length;

  return (
    <ScrollView
      className={styles.page}
      scrollY
      onPullDownRefresh={onPullDownRefresh}
      refresherEnabled
    >
      <View className={styles.header}>
        <View className={styles.welcomeRow}>
          <View className={styles.welcomeText}>
            <Text className={styles.hello}>你好，{currentUser.name} 👋</Text>
            <Text className={styles.subHello}>今天想练什么曲子呢？</Text>
          </View>
          <Image className={styles.userAvatar} src={currentUser.avatar} mode='aspectFill' />
        </View>

        <View className={styles.quotaCard}>
          <View className={styles.quotaInfo}>
            <Text className={styles.quotaLabel}>家庭共享额度</Text>
            <View className={styles.quotaValue}>
              {quotaPool.availableQuota}
              <Text className={styles.unit}>小时</Text>
            </View>
          </View>
          <View className={styles.quotaActions}>
            <Button className={classnames(styles.quotaBtn)} onClick={handleViewRecords}>
              明细
            </Button>
            <Button className={classnames(styles.quotaBtn, styles.primary)} onClick={handleRecharge}>
              充值
            </Button>
          </View>
        </View>
      </View>

      <View className={styles.statsRow}>
        <StatCard value={getAvailableRoomsCount()} label='空闲琴房' variant='success' />
        <StatCard value={myWaitlistCount} label='我的候补' variant='warning' />
        <StatCard value={currentUser.weekPracticeHours} label='本周练琴(h)' variant='secondary' />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>琴房列表</Text>
        </View>

        <ScrollView className={styles.filterTabs} scrollX>
          {filters.map((f) => (
            <View
              key={f.key}
              className={classnames(styles.filterTab, filter === f.key && styles.active)}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </View>
          ))}
        </ScrollView>

        <View className={styles.roomList}>
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => <RoomCard key={room.id} room={room} />)
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无符合条件的琴房</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
