import React from 'react';
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

const QueueItem: React.FC<QueueItemProps> = ({ item, onUpdate }) => {
  const handleConfirm = async () => {
    const success = await confirmWaitlist(item.id);
    if (success) {
      Taro.showToast({ title: '已确认补位', icon: 'success' });
      onUpdate?.();
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
      {item.status === 'notified' && (
        <View className={styles.notifiedBadge}>请尽快确认</View>
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
        <View className={classnames(styles.statusTag, styles[item.status])}>
          {getWaitlistStatusText(item.status)}
        </View>
        {item.status === 'notified' && item.expiresAt && (
          <Text className={styles.expireInfo}>
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
        {item.status === 'notified' && (
          <>
            <Button className={classnames(styles.actionBtn, styles.success)} onClick={handleConfirm}>
              立即确认补位
            </Button>
            <Button className={classnames(styles.actionBtn, styles.secondary)} onClick={handleCancel}>
              放弃
            </Button>
          </>
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
