import { QuotaPool, QuotaTransaction } from '@/types';
import { useQuotaStore } from '@/store/useQuotaStore';

export const getQuotaPool = (): QuotaPool => {
  return useQuotaStore.getState().quotaPool;
};

export const getAvailableQuota = (): number => {
  return useQuotaStore.getState().quotaPool.availableQuota;
};

export const getTransactions = (): QuotaTransaction[] => {
  return useQuotaStore.getState().transactions;
};

export const deductQuota = async (
  amount: number,
  description: string,
  userId: string,
  userName: string
): Promise<boolean> => {
  return useQuotaStore.getState().deductQuota(amount, description, userId, userName);
};

export const rechargeQuota = async (amount: number, operator: string): Promise<boolean> => {
  return useQuotaStore.getState().rechargeQuota(amount, operator);
};

export const refundQuota = async (
  amount: number,
  description: string,
  userId: string,
  userName: string
): Promise<boolean> => {
  return useQuotaStore.getState().refundQuota(amount, description, userId, userName);
};

export const getQuotaLoading = (): boolean => {
  return useQuotaStore.getState().loading;
};

export const getQuotaError = (): string | null => {
  return useQuotaStore.getState().error;
};
