import React, { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { WaitlistItem } from '@/types';
import { getWaitlistStatusText } from '@/utils/format';
import { removeFromWaitlist, confirmWaitlist } from '@/services/queueService';

interface QueueItemProps {
  item: WaitlistItem;
  onUpdate?: () => void;
}

const parseDateTime = (s?: string): number => {
  if (!s) return 0;
  const [datePart, timePart] = s.split(' ');
  if (!datePart || !timePart) return 0;
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
};

const formatRemain = (ms: number): { text: string; urgent: boolean } => {
  if (ms <= 0) return { text: '已超时', urgent: true };
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const text = `${min}分${String(sec).padStart(2, '0')}秒`;
  return { text, urgent: min < 2 };
};

const QueueItem: React.FC<QueueItemProps> = ({ item, onUpdate }) => {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (item.status !== 'notified') return;
    const t = setInterval(() => forceTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [item.status]);

  const remain = item.status === 'notified' && item.expiresAt
    ? formatRemain(parseDateTime(item.expiresAt) - Date.now())
    : null;

  const isExpired = remain?.text === '已超时';

  const handleConfirm = async () => {
    if (isExpired) {
      Taro.showToast({ title: '确认超时，已轮到下一位', icon: 'none' });
      onUpdate?.();
      return;
    }
    const result = await confirmWaitlist(item.id);
    if (result.success) {
      Taro.showToast({ title: result.message, icon: 'success' });
      onUpdate?.();
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/mine/index' });
      }, 1200);
    } else {
      Taro.showToast({ title: result.message, icon: 'error' });
    }
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消候补吗？',
      success: (res) => {
        if (res.confirm) {
          removeFromWaitlist(item.id);
          Taro.showToast({ title: '已取消候补', icon: 'success' });
          onUpdate?.();
        }
      }
    });
  };

  const handleBook = () => {
    Taro.navigateTo({ url: `/pages/room-detail/index?id=${item.roomId}` });
  };

  return (
    <View className={styles.queueItem}>
      {item.status === 'notified' && !isExpired && (
        <View className={classnames(styles.notifiedBadge, remain?.urgent && styles.urgent)}>
          请尽快确认 · 剩余 {remain?.text}
        </View>
      )}
      {item.status === 'notified' && isExpired && (
        <View className={classnames(styles.notifiedBadge, styles.expired)}>
          确认超时，已轮到下一位
        </View>
      )}

      <View className={styles.itemHeader}>
        <View className={styles.roomInfo}>
          <Text className={styles.roomName}>{item.roomName}</Text>
          <Text className={styles.timeInfo}>
            {item.date} {item.startTime}-{item.endTime}
          </Text>
        </View>
        <View className={styles.positionBadge}>
          <Text className={styles.positionText}>第{item.position}位</Text>
        </View>
      </View>

      <View className={styles.statusRow}>
        <View className={classnames(styles.statusTag, item.status)}>
          {getWaitlistStatusText(item.status)}
        </View>
        {item.status === 'notified' && item.expiresAt && (
          <Text className={classnames(styles.expireInfo, remain?.urgent && styles.urgent)}>
            请于 {item.expiresAt.split(' ')[1]} 前确认
          </Text>
        )}
        {item.status === 'waiting' && item.expiresAt && (
          <Text className={styles.expireInfo}>
            候补至 {item.expiresAt}
          </Text>
        )}
      </View>

      <View className={styles.actionRow}>
        {item.status === 'notified' && !isExpired && (
          <>
            <Button className={classnames(styles.actionBtn, styles.success)} onClick={handleConfirm}>
              立即确认补位
            </Button>
            <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleCancel}>
              放弃
            </Button>
          </>
        )}
        {(item.status === 'notified' && isExpired) && (
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={onUpdate}>
            刷新状态
          </Button>
        )}
        {item.status === 'waiting' && (
          <Button className={classnames(styles.actionBtn, styles.danger)} onClick={handleCancel}>
            取消候补
          </Button>
        )}
        {item.status === 'confirmed' && (
          <Button className={classnames(styles.actionBtn, styles.primary)} onClick={handleBook}>
            查看详情
          </Button>
        )}
        {(item.status === 'cancelled' || item.status === 'expired') && (
          <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleBook}>
            重新预约
          </Button>
        )}
      </View>
    </View>
  );
};

export default QueueItem;
