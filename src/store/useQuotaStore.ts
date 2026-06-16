import { create } from 'zustand';
import { QuotaPool, QuotaTransaction } from '@/types';
import { mockQuotaPool, mockQuotaTransactions } from '@/data/users';
import { withLock, checkAndIncrementVersion, getCurrentVersion } from '@/utils/lock';
import { formatDateTime } from '@/utils/time';

interface QuotaStore {
  quotaPool: QuotaPool;
  transactions: QuotaTransaction[];
  loading: boolean;
  error: string | null;
  deductQuota: (amount: number, description: string, userId: string, userName: string) => Promise<boolean>;
  rechargeQuota: (amount: number, operator: string) => Promise<boolean>;
  refundQuota: (amount: number, description: string, userId: string, userName: string) => Promise<boolean>;
  refreshQuota: () => void;
}

export const useQuotaStore = create<QuotaStore>((set, get) => ({
  quotaPool: mockQuotaPool,
  transactions: mockQuotaTransactions,
  loading: false,
  error: null,

  deductQuota: async (amount, description, userId, userName) => {
    const lockKey = `quota-${get().quotaPool.familyId}`;

    try {
      return await withLock(lockKey, async () => {
        set({ loading: true, error: null });

        const currentPool = get().quotaPool;
        const expectedVersion = getCurrentVersion(lockKey);

        if (currentPool.availableQuota < amount) {
          set({ loading: false, error: '额度不足' });
          console.error('[Quota] Insufficient quota:', { available: currentPool.availableQuota, requested: amount });
          return false;
        }

        const versionCheck = checkAndIncrementVersion(lockKey, expectedVersion);
        if (!versionCheck.success) {
          set({ loading: false, error: '数据冲突，请重试' });
          console.error('[Quota] Version conflict');
          return false;
        }

        const newUsed = currentPool.usedQuota + amount;
        const newAvailable = currentPool.totalQuota - newUsed;

        const transaction: QuotaTransaction = {
          id: `tx-${Date.now()}`,
          type: 'consume',
          amount: -amount,
          balanceAfter: newAvailable,
          description,
          operator: userName,
          userId,
          userName,
          createdAt: formatDateTime()
        };

        set({
          quotaPool: {
            ...currentPool,
            usedQuota: newUsed,
            availableQuota: newAvailable,
            lockVersion: versionCheck.newVersion,
            updatedAt: new Date().toISOString()
          },
          transactions: [transaction, ...get().transactions],
          loading: false
        });

        console.log('[Quota] Deducted successfully:', { amount, newAvailable });
        return true;
      });
    } catch (error) {
      const err = error as Error;
      console.error('[Quota] Deduct failed:', err.message);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  rechargeQuota: async (amount, operator) => {
    const lockKey = `quota-${get().quotaPool.familyId}`;

    try {
      return await withLock(lockKey, async () => {
        set({ loading: true, error: null });

        const currentPool = get().quotaPool;
        const newTotal = currentPool.totalQuota + amount;
        const newAvailable = newTotal - currentPool.usedQuota;

        const transaction: QuotaTransaction = {
          id: `tx-${Date.now()}`,
          type: 'recharge',
          amount,
          balanceAfter: newAvailable,
          description: '充值家庭共享额度',
          operator,
          createdAt: formatDateTime()
        };

        set({
          quotaPool: {
            ...currentPool,
            totalQuota: newTotal,
            availableQuota: newAvailable,
            updatedAt: new Date().toISOString()
          },
          transactions: [transaction, ...get().transactions],
          loading: false
        });

        console.log('[Quota] Recharged successfully:', { amount, newAvailable });
        return true;
      });
    } catch (error) {
      const err = error as Error;
      console.error('[Quota] Recharge failed:', err.message);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  refundQuota: async (amount, description, userId, userName) => {
    const lockKey = `quota-${get().quotaPool.familyId}`;

    try {
      return await withLock(lockKey, async () => {
        set({ loading: true, error: null });

        const currentPool = get().quotaPool;
        const newUsed = Math.max(0, currentPool.usedQuota - amount);
        const newAvailable = currentPool.totalQuota - newUsed;

        const transaction: QuotaTransaction = {
          id: `tx-${Date.now()}`,
          type: 'refund',
          amount,
          balanceAfter: newAvailable,
          description,
          operator: '系统',
          userId,
          userName,
          createdAt: formatDateTime()
        };

        set({
          quotaPool: {
            ...currentPool,
            usedQuota: newUsed,
            availableQuota: newAvailable,
            updatedAt: new Date().toISOString()
          },
          transactions: [transaction, ...get().transactions],
          loading: false
        });

        console.log('[Quota] Refunded successfully:', { amount, newAvailable });
        return true;
      });
    } catch (error) {
      const err = error as Error;
      console.error('[Quota] Refund failed:', err.message);
      set({ loading: false, error: err.message });
      return false;
    }
  },

  refreshQuota: () => {
    console.log('[Quota] Refreshing quota pool');
  }
}));
