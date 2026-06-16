import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Room } from '@/types';
import { getRoomStatusText } from '@/utils/format';

interface RoomCardProps {
  room: Room;
  showAction?: boolean;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, showAction = true, onClick }) => {
  const statusClassMap: Record<string, string> = {
    available: styles.statusAvailable,
    occupied: styles.statusOccupied,
    full: styles.statusFull,
    pending: styles.statusPending,
    maintenance: styles.statusPending
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/room-detail/index?id=${room.id}` });
    }
  };

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/room-detail/index?id=${room.id}` });
  };

  return (
    <View className={styles.roomCard} onClick={handleClick}>
      <View className={styles.cardImage}>
        <Image className={styles.image} src={room.image} mode='aspectFill' />
        <View className={classnames(styles.statusBadge, statusClassMap[room.status])}>
          {getRoomStatusText(room.status)}
        </View>
      </View>

      <View className={styles.cardContent}>
        <View className={styles.cardHeader}>
          <Text className={styles.roomName}>{room.name}</Text>
          <Text className={styles.roomNumber}>{room.number}</Text>
        </View>

        <Text className={styles.roomLocation}>{room.location}</Text>

        <View className={styles.roomFeatures}>
          {room.features.map((feature, index) => (
            <View key={index} className={styles.featureTag}>
              {feature}
            </View>
          ))}
        </View>

        <View className={styles.cardFooter}>
          <View className={styles.priceInfo}>
            <Text className={styles.price}>{room.pricePerHour}</Text>
            <Text className={styles.priceUnit}>/小时</Text>
          </View>

          {showAction && (
            <Button
              className={classnames(styles.actionButton, room.status === 'full' && styles.disabled)}
              disabled={room.status === 'full'}
              onClick={handleBook}
            >
              {room.status === 'full' ? '候补排队' : '立即预约'}
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default RoomCard;
