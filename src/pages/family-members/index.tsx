import React, { useState } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { getFamilyMembers, getFamilyCode } from '@/services/bookingService';
import { getRoleText } from '@/utils/format';
import { FamilyMember } from '@/types';

const FamilyMembersPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const currentUser = useUserStore((s) => s.currentUser);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
  });

  const familyMembers: FamilyMember[] = React.useMemo(() => getFamilyMembers(), [refreshKey]);
  const familyCode = getFamilyCode();

  const handleCopyCode = () => {
    Taro.setClipboardData({
      data: familyCode,
      success: () => {
        Taro.showToast({ title: '邀请码已复制', icon: 'success' });
      }
    });
  };

  const handleAddMember = () => {
    Taro.showModal({
      title: '添加家庭成员',
      content: '将邀请码分享给家人\n\n家人通过邀请码加入后，可共享家庭练琴额度',
      confirmText: '我知道了',
      showCancel: false
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.familyHeader}>
        <Text className={styles.familyTitle}>家庭邀请码</Text>
        <View className={styles.familyCode}>
          <View>
            <Text className={styles.codeLabel}>分享给家人加入</Text>
            <Text className={styles.codeValue}>{familyCode}</Text>
          </View>
          <Button className={styles.copyBtn} onClick={handleCopyCode}>
            复制
          </Button>
        </View>
      </View>

      <Text className={styles.sectionTitle}>家庭成员（{familyMembers.length}人）</Text>

      <View className={styles.memberList}>
        {familyMembers.map((member: FamilyMember) => (
          <View key={member.id} className={styles.memberRow}>
            <Image className={styles.memberAvatar} src={member.avatar} mode='aspectFill' />
            <View className={styles.memberInfo}>
              <View className={styles.memberNameRow}>
                <Text className={styles.memberName}>{member.name}</Text>
                {member.isOwner && (
                  <View className={styles.ownerBadge}>
                    <Text>房主</Text>
                  </View>
                )}
                <View className={styles.roleBadge}>
                  <Text>{getRoleText(member.role)}</Text>
                </View>
              </View>
              <Text className={styles.memberMeta}>{member.relation} · {member.phone}</Text>
            </View>
            <View className={styles.memberStats}>
              <Text className={styles.statsValue}>{member.totalPracticeHours}</Text>
              <Text className={styles.statsLabel}>小时</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.tips}>
        <Text className={styles.tipsTitle}>共享说明</Text>
        <Text className={styles.tipsText}>
          • 所有家庭成员共享同一额度池，充值后全家可用
        </Text>
        <Text className={styles.tipsText}>
          • 房主可管理成员、查看全员练琴数据
        </Text>
        <Text className={styles.tipsText}>
          • 多人同时预约会自动加锁，防止超额扣款
        </Text>
        <Text className={styles.tipsText}>
          • 每位成员的预约、练琴记录独立统计
        </Text>
      </View>
    </ScrollView>
  );
};

export default FamilyMembersPage;
