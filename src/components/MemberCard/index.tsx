import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { FamilyMember } from '@/types';
import { getRoleText } from '@/utils/format';

interface MemberCardProps {
  member: FamilyMember;
}

const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  return (
    <View className={styles.memberCard}>
      <Image className={styles.avatar} src={member.avatar} mode='aspectFill' />
      <View className={styles.info}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{member.name}</Text>
          <View className={classnames(styles.roleTag, styles[member.role])}>
            {getRoleText(member.role)}
          </View>
        </View>
        <Text className={styles.subInfo}>
          {member.relation} · {member.phone}
        </Text>
        <Text className={styles.stats}>
          本月练琴 <Text className={styles.statsHighlight}>{member.monthPracticeHours}小时</Text>
          · 累计 {member.totalPracticeHours}小时
        </Text>
      </View>
    </View>
  );
};

export default MemberCard;
