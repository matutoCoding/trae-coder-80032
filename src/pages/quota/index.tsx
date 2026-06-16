import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import MemberCard from '@/components/MemberCard';
import { useQuotaStore } from '@/store/useQuotaStore';
import { useUserStore } from '@/store/useUserStore';
import { useQueueStore } from '@/store/useQueueStore';
import { QuotaTransaction } from '@/types';
import { getTransactionTypeText } from '@/utils/format';

const rechargePackages = [
  { hours: 10, price: 200, bonus: 0 },
  { hours: 30, price: 540, bonus: 5 },
  { hours: 50, price: 800, bonus: 10 },
  { hours: 100, price: 1500, bonus: 25 },
  { hours: 200, price: 2800, bonus: 60 },
  { hours: 500, price: 6500, bonus: 200 }
];

const QuotaPage: React.FC = () => {
  const quotaPool = useQuotaStore((s) => s.quotaPool);
  const transactions = useQuotaStore((s) => s.transactions);
  const rechargeQuota = useQuotaStore((s) => s.rechargeQuota);
  const currentUser = useUserStore((s) => s.currentUser);
  const familyMembers = useUserStore((s) => s.familyMembers);
  const bookings = useQueueStore((s) => s.bookings);

  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [showRecharge, setShowRecharge] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
    console.log('[QuotaPage] Page shown');
  });

  const onPullDownRefresh = () => {
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  const usagePercent = quotaPool.totalQuota > 0
    ? Math.round((quotaPool.usedQuota / quotaPool.totalQuota) * 100)
    : 0;

  const memberBookings = familyMembers.slice(0, 3);

  const handleRecharge = async () => {
    const pkg = rechargePackages[selectedPackage];
    const totalHours = pkg.hours + pkg.bonus;
    Taro.showLoading({ title: '充值中...' });
    const success = await rechargeQuota(totalHours, currentUser.name);
    Taro.hideLoading();
    if (success) {
      Taro.showToast({ title: `充值成功 +${totalHours}小时`, icon: 'success' });
      setShowRecharge(false);
      setRefreshKey((k) => k + 1);
    } else {
      Taro.showToast({ title: '充值失败', icon: 'error' });
    }
  };

  const handleViewFamily = () => {
    Taro.navigateTo({ url: '/pages/family-members/index' });
  };

  const handleViewRecords = () => {
    Taro.navigateTo({ url: '/pages/records/index' });
  };

  const getTxIcon = (type: QuotaTransaction['type']) => {
    const icons = {
      recharge: '💰',
      consume: '🎹',
      refund: '↩️',
      transfer: '💸'
    };
    return icons[type] || '📋';
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ScrollView
      className={styles.page}
      scrollY
      onPullDownRefresh={onPullDownRefresh}
      refresherEnabled
    >
      <View className={styles.quotaHeader}>
        <Text className={styles.quotaTitle}>家庭共享额度池</Text>
        <View className={styles.quotaAmount}>
          <Text className={styles.amountValue}>{quotaPool.availableQuota}</Text>
          <Text className={styles.amountUnit}>小时可用</Text>
        </View>
        <View className={styles.quotaStats}>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>累计充值</Text>
            <Text className={styles.statValue}>{quotaPool.totalQuota}h</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>已使用</Text>
            <Text className={styles.statValue}>{quotaPool.usedQuota}h</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statLabel}>家庭成员</Text>
            <Text className={styles.statValue}>{familyMembers.length}人</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.actionCard} onClick={() => setShowRecharge(true)}>
          <View className={classnames(styles.actionIcon, styles.recharge)}>💰</View>
          <View className={styles.actionInfo}>
            <Text className={styles.actionTitle}>充值额度</Text>
            <Text className={styles.actionDesc}>多人共享，全家可用</Text>
          </View>
        </View>
        <View className={styles.actionCard} onClick={handleViewFamily}>
          <View className={classnames(styles.actionIcon, styles.members)}>👨‍👩‍👧‍👦</View>
          <View className={styles.actionInfo}>
            <Text className={styles.actionTitle}>家庭管理</Text>
            <Text className={styles.actionDesc}>成员与权限管理</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>使用进度</Text>
        </View>
        <View className={styles.progressCard}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressLabel}>本月额度使用</Text>
            <Text className={styles.progressPercent}>{usagePercent}%</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${usagePercent}%` }}></View>
          </View>
          <View className={styles.progressInfo}>
            <Text>已使用 {quotaPool.usedQuota} 小时</Text>
            <Text>剩余 {quotaPool.availableQuota} 小时</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>家庭成员</Text>
          <Text className={styles.sectionMore} onClick={handleViewFamily}>查看全部</Text>
        </View>
        {memberBookings.map((member) => (
          <MemberCard key={member.id + refreshKey} member={member} />
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>额度明细</Text>
          <Text className={styles.sectionMore} onClick={handleViewRecords}>全部记录</Text>
        </View>
        <View className={styles.txList}>
          {recentTransactions.map((tx) => (
            <View key={tx.id} className={styles.txItem}>
              <View className={classnames(styles.txIcon, styles[tx.type])}>
                {getTxIcon(tx.type)}
              </View>
              <View className={styles.txInfo}>
                <Text className={styles.txTitle}>{tx.description}</Text>
                <Text className={styles.txMeta}>
                  {getTransactionTypeText(tx.type)} · {tx.createdAt}
                </Text>
              </View>
              <Text className={classnames(
                styles.txAmount,
                tx.amount > 0 ? styles.positive : styles.negative
              )}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}h
              </Text>
            </View>
          ))}
        </View>
      </View>

      {showRecharge && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>选择充值套餐</Text>
          </View>
          <View className={styles.rechargePackages}>
            {rechargePackages.map((pkg, index) => (
              <View
                key={index}
                className={classnames(styles.packageCard, selectedPackage === index && styles.selected)}
                onClick={() => setSelectedPackage(index)}
              >
                <Text className={styles.packageHours}>{pkg.hours}</Text>
                <Text className={styles.packageUnit}>小时</Text>
                <Text className={styles.packagePrice}>¥{pkg.price}</Text>
                {pkg.bonus > 0 && (
                  <Text className={styles.packageBonus}>+送{pkg.bonus}h</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {showRecharge && (
        <View className={styles.bottomBar}>
          <View>
            <Text className={styles.totalLabel}>应付金额</Text>
            <Text className={styles.totalPrice}>¥{rechargePackages[selectedPackage].price}</Text>
          </View>
          <Button className={styles.confirmBtn} onClick={handleRecharge}>
            立即充值
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default QuotaPage;
