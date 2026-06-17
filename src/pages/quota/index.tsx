import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import MemberCard from '@/components/MemberCard';
import { useQuotaStore } from '@/store/useQuotaStore';
import { useUserStore } from '@/store/useUserStore';
import { useQueueStore } from '@/store/useQueueStore';
import { QuotaTransaction, FamilyMember } from '@/types';
import { getTransactionTypeText } from '@/utils/format';

const rechargePackages = [
  { hours: 10, price: 200, bonus: 0 },
  { hours: 30, price: 540, bonus: 5 },
  { hours: 50, price: 800, bonus: 10 },
  { hours: 100, price: 1500, bonus: 25 },
  { hours: 200, price: 2800, bonus: 60 },
  { hours: 500, price: 6500, bonus: 200 }
];

const getThisMonthPrefix = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const QuotaPage: React.FC = () => {
  const quotaPool = useQuotaStore((s) => s.quotaPool);
  const transactions = useQuotaStore((s) => s.transactions);
  const rechargeQuota = useQuotaStore((s) => s.rechargeQuota);
  const currentUser = useUserStore((s) => s.currentUser);
  const allMembers = useUserStore((s) => s.allMembers);
  const waitlist = useQueueStore((s) => s.waitlist);

  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [showRecharge, setShowRecharge] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
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

  const monthPrefix = getThisMonthPrefix();

  const memberMonthHours = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'consume' && tx.userId && tx.createdAt.startsWith(monthPrefix)) {
        const absHours = Math.abs(tx.amount);
        map[tx.userId] = (map[tx.userId] || 0) + absHours;
      }
    });
    return map;
  }, [transactions, monthPrefix, refreshKey]);

  const tabs = useMemo(() => ([
    { id: 'all', name: '全部', avatar: '', relation: '全部成员', hours: 0, isOwner: false, phone: '', role: 'member' as const, totalPracticeHours: 0, monthPracticeHours: 0, joinDate: '' },
    ...allMembers
  ] as Array<{ id: string; name: string; avatar: string; relation?: string; hours?: number } & Partial<FamilyMember>>), [allMembers]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;
    if (selectedMemberId !== 'all') {
      list = list.filter((tx) => {
        if (tx.type === 'recharge') return true;
        if (tx.userId === selectedMemberId) return true;
        const waitlistTx = tx.description?.includes('候补补位');
        if (waitlistTx) {
          const wl = waitlist.find((w) => tx.waitlistId === w.id || (w.userId === selectedMemberId && tx.description.includes(w.roomName)));
          return !!wl;
        }
        return false;
      });
    }
    return list.slice(0, 30);
  }, [transactions, selectedMemberId, waitlist, refreshKey]);

  const selectedMember = allMembers.find((m) => m.id === selectedMemberId);

  const handleRecharge = async () => {
    const pkg = rechargePackages[selectedPackage];
    const totalHours = pkg.hours + pkg.bonus;
    Taro.showLoading({ title: '充值中...' });
    const success = await rechargeQuota(totalHours, currentUser.name);
    Taro.hideLoading();
    if (success) {
      Taro.showToast({ title: `充值成功 +${totalHours}小时`, icon: 'success' });
      setShowRecharge(false);
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
    const icons: Record<string, string> = {
      recharge: '💰',
      consume: '🎹',
      refund: '↩️',
      transfer: '💸'
    };
    return icons[type] || '📋';
  };

  const isWaitlistTx = (tx: QuotaTransaction) => {
    return tx.description?.includes('候补补位') || tx.waitlistId !== undefined;
  };

  const getTxMemberName = (tx: QuotaTransaction): string => {
    if (tx.type === 'recharge') return '系统充值';
    if (tx.userName) return tx.userName;
    if (tx.userId) {
      const m = allMembers.find((mem) => mem.id === tx.userId);
      if (m) return m.name;
    }
    if (tx.waitlistId) {
      const wl = waitlist.find((w) => w.id === tx.waitlistId);
      if (wl) return wl.userName;
    }
    return '系统';
  };

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
            <Text className={styles.statValue}>{allMembers.length}人</Text>
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
          <Text className={styles.sectionTitle}>家庭成员本月统计</Text>
          <Text className={styles.sectionMore} onClick={handleViewFamily}>全部</Text>
        </View>
        <View className={styles.monthStats}>
          {allMembers.map((m) => (
            <View key={m.id} className={styles.monthStatsRow} onClick={() => setSelectedMemberId(m.id)}>
              <View className={styles.memberCol}>
                <Image className={styles.monthAvatar} src={m.avatar} mode='aspectFill' />
                <Text className={styles.memberName}>{m.name}</Text>
              </View>
              <Text className={styles.monthHours}>
                {memberMonthHours[m.id] || 0} 小时
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>额度明细</Text>
          <Text className={styles.sectionMore} onClick={handleViewRecords}>全部记录</Text>
        </View>

        <View className={styles.memberTabs}>
          {tabs.map((tab) => {
            const isAll = tab.id === 'all';
            const member = !isAll ? (tab as FamilyMember) : null;
            const hours = isAll ? 0 : (memberMonthHours[tab.id] || 0);
            return (
              <View
                key={tab.id}
                className={classnames(styles.memberTab, selectedMemberId === tab.id && styles.active)}
                onClick={() => setSelectedMemberId(tab.id)}
              >
                {!isAll && member && (
                  <Image className={styles.tabAvatar} src={member.avatar} mode='aspectFill' />
                )}
                {isAll && <Text>👥</Text>}
                <Text className={styles.tabName}>
                  {isAll ? '全部' : (member?.name || '')}
                </Text>
                {!isAll && (
                  <Text className={styles.tabHours}>{hours}h</Text>
                )}
              </View>
            );
          })}
        </View>

        {selectedMemberId !== 'all' && selectedMember && (
          <View className={styles.filterNotice}>
            正在查看 <Text style={{ fontWeight: 'bold' }}>{selectedMember.name}</Text> 的预约消耗、退款和候补补位记录
          </View>
        )}

        <View className={styles.txList}>
          {filteredTransactions.length === 0 ? (
            <View className={styles.emptyTx}>暂无相关记录</View>
          ) : (
            filteredTransactions.map((tx) => (
              <View key={tx.id} className={styles.txItem}>
                <View className={classnames(styles.txIcon, styles[tx.type])}>
                  {getTxIcon(tx.type)}
                </View>
                <View className={styles.txInfo}>
                  <View style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text className={styles.txTitle}>{tx.description}</Text>
                    {isWaitlistTx(tx) && <Text className={styles.txUserLabel}>候补补位</Text>}
                  </View>
                  <Text className={styles.txMeta}>
                    {getTransactionTypeText(tx.type)} · {getTxMemberName(tx)} · {tx.createdAt}
                  </Text>
                </View>
                <Text className={classnames(
                  styles.txAmount,
                  tx.amount > 0 ? styles.positive : styles.negative
                )}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}h
                </Text>
              </View>
            ))
          )}
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
