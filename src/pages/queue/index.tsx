import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import QueueItem from '@/components/QueueItem';
import { useUserStore } from '@/store/useUserStore';
import { useQueueStore } from '@/store/useQueueStore';
import { WaitlistItem } from '@/types';

const QueuePage: React.FC = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const waitlist = useQueueStore((s) => s.waitlist);
  const processAutoRelease = useQueueStore((s) => s.processAutoRelease);
  const notifyNextWaitlist = useQueueStore((s) => s.notifyNextWaitlist);

  const [activeTab, setActiveTab] = useState<string>('mine');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useDidShow(() => {
    processAutoRelease();
    setRefreshKey((k) => k + 1);
    console.log('[QueuePage] Page shown');
  });

  const onPullDownRefresh = () => {
    processAutoRelease();
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const myWaitlist = useMemo(() => {
    return waitlist
      .filter((w) => w.userId === currentUser.id)
      .sort((a, b) => {
        const statusOrder = { notified: 0, waiting: 1, confirmed: 2, cancelled: 3, expired: 4 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
  }, [waitlist, currentUser.id, refreshKey]);

  const allWaitlist = useMemo(() => {
    return waitlist
      .filter((w) => w.status === 'waiting' || w.status === 'notified')
      .sort((a, b) => {
        if (a.roomId !== b.roomId) return a.roomId.localeCompare(b.roomId);
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
        return a.position - b.position;
      });
  }, [waitlist, refreshKey]);

  const displayedList: WaitlistItem[] = activeTab === 'mine' ? myWaitlist : allWaitlist;

  const handleUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleGoBook = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const handleTestNotify = () => {
    Taro.showToast({ title: '模拟触发补位通知', icon: 'none' });
    notifyNextWaitlist('room-003', '2026-06-17', '19:00');
    setTimeout(() => setRefreshKey((k) => k + 1), 500);
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      onPullDownRefresh={onPullDownRefresh}
      refresherEnabled
    >
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'mine' && styles.active)}
          onClick={() => setActiveTab('mine')}
        >
          我的候补
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'all' && styles.active)}
          onClick={() => setActiveTab('all')}
        >
          全部队列
        </View>
      </View>

      {activeTab === 'mine' && myWaitlist.some((w) => w.status === 'notified') && (
        <View className={styles.noticeBar}>
          <Text className={styles.noticeIcon}>🔔</Text>
          <Text className={styles.noticeText}>您有候补已轮到，请尽快确认补位！</Text>
        </View>
      )}

      <View className={styles.queueList}>
        {displayedList.length > 0 ? (
          displayedList.map((item) => (
            <QueueItem key={item.id + refreshKey} item={item} onUpdate={handleUpdate} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎹</Text>
            <Text className={styles.emptyTitle}>
              {activeTab === 'mine' ? '暂无候补记录' : '暂无候补队列'}
            </Text>
            <Text className={styles.emptyDesc}>
              {activeTab === 'mine' ? '去选择心仪的琴房开始候补吧' : '当前所有琴房暂无排队'}
            </Text>
            {activeTab === 'mine' && (
              <Button className={styles.emptyBtn} onClick={handleGoBook}>
                去预约琴房
              </Button>
            )}
          </View>
        )}
      </View>

      {activeTab === 'all' && (
        <View className={styles.howItWorks}>
          <Text className={styles.howTitle}>候补补位机制</Text>
          <View className={styles.stepList}>
            <View className={styles.step}>
              <View className={styles.stepNum}>1</View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>加入候补</Text>
                <Text className={styles.stepDesc}>琴房满员时可加入候补队列，按顺序排队</Text>
              </View>
            </View>
            <View className={styles.step}>
              <View className={styles.stepNum}>2</View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>超时自动释放</Text>
                <Text className={styles.stepDesc}>预约者15分钟内未签到，预约自动取消</Text>
              </View>
            </View>
            <View className={styles.step}>
              <View className={styles.stepNum}>3</View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>补位通知</Text>
                <Text className={styles.stepDesc}>队列首位将收到通知，需15分钟内确认</Text>
              </View>
            </View>
            <View className={styles.step}>
              <View className={styles.stepNum}>4</View>
              <View className={styles.stepContent}>
                <Text className={styles.stepTitle}>确认完成</Text>
                <Text className={styles.stepDesc}>确认后即时占用该时段，完成练琴预约</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default QueuePage;
