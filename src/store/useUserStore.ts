import { create } from 'zustand';
import { User, FamilyMember } from '@/types';
import { mockUser, mockFamilyMembers } from '@/data/users';

interface UserStore {
  currentUser: User;
  familyMembers: FamilyMember[];
  currentAsMember: FamilyMember;
  allMembers: FamilyMember[];
  setCurrentUser: (user: User) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (memberId: string) => void;
  updateMemberRole: (memberId: string, role: FamilyMember['role']) => void;
  getMemberById: (id: string) => FamilyMember | undefined;
}

const toMember = (user: User): FamilyMember => ({
  id: user.id,
  name: user.name,
  avatar: user.avatar,
  role: user.role,
  relation: '本人',
  phone: user.phone,
  isOwner: user.role === 'owner',
  totalPracticeHours: user.totalPracticeHours,
  monthPracticeHours: user.monthPracticeHours,
  joinDate: '2024-01-15'
});

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: mockUser,
  familyMembers: mockFamilyMembers,

  get currentAsMember() {
    return toMember(get().currentUser);
  },

  get allMembers() {
    const { currentUser, familyMembers } = get();
    const owner = toMember(currentUser);
    const others = familyMembers.filter((m) => m.id !== currentUser.id);
    return [owner, ...others];
  },

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
    })),

  getMemberById: (id) => {
    const { allMembers } = get();
    return allMembers.find((m) => m.id === id);
  }
}));
