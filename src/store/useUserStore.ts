import { create } from 'zustand';
import { User, FamilyMember } from '@/types';
import { mockUser, mockFamilyMembers } from '@/data/users';

interface UserStore {
  currentUser: User;
  familyMembers: FamilyMember[];
  setCurrentUser: (user: User) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (memberId: string) => void;
  updateMemberRole: (memberId: string, role: FamilyMember['role']) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: mockUser,
  familyMembers: mockFamilyMembers,
  setCurrentUser: (user) => set({ currentUser: user }),
  addFamilyMember: (member) =>
    set((state) => ({ familyMembers: [...state.familyMembers, member] })),
  removeFamilyMember: (memberId) =>
    set((state) => ({
      familyMembers: state.familyMembers.filter((m) => m.id !== memberId)
    })),
  updateMemberRole: (memberId, role) =>
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === memberId ? { ...m, role } : m
      )
    }))
}));
