import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getRoomById } from '@/services/roomService';
import { createBooking } from '@/services/bookingService';
import { useUserStore } from '@/store/useUserStore';
import { useQuotaStore } from '@/store/useQuotaStore';
import { useRoomStore } from '@/store/useRoomStore';
import { getRoleText } from '@/utils/format';
import { formatDuration } from '@/utils/time';
import { Room, FamilyMember } from '@/types';

const BookingConfirmPage: React.FC = () => {
  const router = useRouter();
  const {
    roomId,
    date,
    startTime,
    endTime,
    duration,
    quota
  } = router.params;

  const [room, setRoom] = useState<Room | undefined>();
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const currentUserId = useUserStore((s) => s.currentUser.id);
  const allMembers = useUserStore((s) => s.allMembers);
  const quotaPool = useQuotaStore((s) => s.quotaPool);
  const updateTimeSlotStatus = useRoomStore((s) => s.updateTimeSlotStatus);

  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);

  useEffect(() => {
    const found = getRoomById(roomId as string);
    setRoom(found);
  }, [roomId]);

  const selectedUser: FamilyMember =
    allMembers.find((m) => m.id === selectedUserId) || allMembers[0];

  const durationNum = parseInt(duration as string, 10);
  const quotaNum = parseInt(quota as string, 10);
  const hasEnoughQuota = quotaPool.availableQuota >= quotaNum;

  const handleSelectUser = () => {
    const options = allMembers.map((m) => `${m.name}（${getRoleText(m.role)}）`);
    const currentIndex = allMembers.findIndex((m) => m.id === selectedUserId);

    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        const member = allMembers[res.tapIndex];
        if (member) {
          setSelectedUserId(member.id);
        }
      },
      fail: (err) => {
        if (err && err.errMsg && !err.errMsg.includes('cancel')) {
          console.warn('actionSheet fail:', err);
        }
      }
    });
  };

  const handleConfirm = async () => {
    if (!room || loading) return;
    if (!selectedUser) {
      Taro.showToast({ title: '请选择使用人', icon: 'none' });
      return;
    }
    if (!hasEnoughQuota) {
      Taro.showToast({ title: '额度不足，请先充值', icon: 'none' });
      return;
    }

    setLoading(true);

    const result = await createBooking({
      roomId: room.id,
      roomName: room.name,
      userId: selectedUser.id,
      userName: selectedUser.name,
      date: date as string,
      startTime: startTime as string,
      endTime: endTime as string,
      duration: durationNum,
      quotaUsed: quotaNum
    });

    setLoading(false);

    if (result.success) {
      const startHour = parseInt((startTime as string).split(':')[0], 10);
      const endHour = parseInt((endTime as string).split(':')[0], 10);
      for (let h = startHour; h < endHour; h++) {
        const slotId = `${room.id}-${date}-${h}`;
        updateTimeSlotStatus(room.id, slotId, 'booked');
      }

      setShowSuccess(true);
    } else {
      Taro.showToast({ title: result.message, icon: 'error' });
    }
  };

  const handleViewBooking = () => {
    setShowSuccess(false);
    Taro.switchTab({ url: '/pages/mine/index' });
  };

  const handleGoHome = () => {
    setShowSuccess(false);
    Taro.switchTab({ url: '/pages/index/index' });
  };

  if (!room) {
    return <View className={styles.page}><Text>加载中...</Text></View>;
  }

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>琴房信息</Text>
        <View className={styles.roomHeader}>
          <Image className={styles.roomImage} src={room.image} mode='aspectFill' />
          <View className={styles.roomInfo}>
            <Text className={styles.roomName}>{room.name}</Text>
            <Text className={styles.roomLocation}>{room.location}</Text>
            <Text className={styles.roomPrice}>¥{room.pricePerHour}/小时</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预约信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>预约日期</Text>
          <Text className={styles.infoValue}>{date}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>使用时段</Text>
          <Text className={classnames(styles.infoValue, styles.highlight)}>
            {startTime} - {endTime}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>使用时长</Text>
          <Text className={styles.infoValue}>{formatDuration(durationNum)}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>使用人</Text>
        <View className={styles.userRow}>
          <Image className={styles.userAvatar} src={selectedUser?.avatar} mode='aspectFill' />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{selectedUser?.name}</Text>
            <Text className={styles.userRole}>
              {getRoleText(selectedUser?.role)} · {selectedUser?.relation}
            </Text>
          </View>
          <Button className={styles.changeBtn} onClick={handleSelectUser}>
            更换
          </Button>
        </View>

        <View className={styles.ruleBox}>
          <Text className={styles.ruleTitle}>预约须知</Text>
          <Text className={styles.ruleItem}>预约成功后，请在开始时间后15分钟内签到</Text>
          <Text className={styles.ruleItem}>超时未签到，预约将自动取消并释放给候替补位</Text>
          <Text className={styles.ruleItem}>如需取消，请提前至少1小时操作，额度将原路退回</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>费用明细</Text>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>时长单价</Text>
          <Text className={styles.summaryValue}>¥{room.pricePerHour}/小时</Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>使用时长</Text>
          <Text className={styles.summaryValue}>{formatDuration(durationNum)}</Text>
        </View>
        <View className={styles.totalRow}>
          <Text className={styles.totalLabel}>消耗额度</Text>
          <View className={styles.totalValue}>
            {quotaNum}
            <Text className={styles.unit}>小时</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.quotaInfo}>
          <Text className={styles.quotaLabel}>可用额度</Text>
          <Text className={classnames(styles.quotaValue, !hasEnoughQuota && 'error')}>
            {quotaPool.availableQuota}
          </Text>
          <Text className={styles.quotaTotal}>小时</Text>
        </View>
        <Button
          className={classnames(styles.confirmBtn, (!hasEnoughQuota || loading) && styles.disabled)}
          disabled={!hasEnoughQuota || loading}
          onClick={handleConfirm}
        >
          {loading ? '确认中...' : '确认预约'}
        </Button>
      </View>

      {showSuccess && (
        <View className={styles.successOverlay}>
          <View className={styles.successCard}>
            <View className={styles.successIcon}>✓</View>
            <Text className={styles.successTitle}>预约成功</Text>
            <Text className={styles.successDesc}>
              {room.name}{'\n'}
              {date} {startTime}-{endTime}{'\n'}
              请按时签到开始练习
            </Text>
            <View className={styles.successActions}>
              <Button className={classnames(styles.successBtn, styles.secondary)} onClick={handleGoHome}>
                返回首页
              </Button>
              <Button className={classnames(styles.successBtn, styles.primary)} onClick={handleViewBooking}>
                查看预约
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookingConfirmPage;
