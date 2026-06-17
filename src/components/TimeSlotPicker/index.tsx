import React, { useState, useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { TimeSlot } from '@/types';
import { getDateList, formatDate } from '@/utils/time';
import { useRoomStore } from '@/store/useRoomStore';

interface TimeSlotPickerProps {
  roomId: string;
  onSelect?: (slots: TimeSlot[]) => void;
  onDateChange?: (date: string) => void;
  value?: string;
  defaultValue?: string;
  multiSelect?: boolean;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  roomId,
  onSelect,
  onDateChange,
  value,
  defaultValue,
  multiSelect = false
}) => {
  const isControlled = value !== undefined;
  const [innerDate, setInnerDate] = useState<string>(defaultValue || formatDate());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const dateList = getDateList(7);

  const selectedDate = isControlled ? value! : innerDate;

  const getTimeSlots = useRoomStore((state) => state.getTimeSlots);
  const timeSlotsMap = useRoomStore((state) => state.timeSlots);

  const slots = useMemo(() => {
    const key = `${roomId}-${selectedDate}`;
    const cached = timeSlotsMap[key];
    if (cached) return cached;
    return getTimeSlots(roomId, selectedDate);
  }, [roomId, selectedDate, timeSlotsMap, getTimeSlots]);

  useEffect(() => {
    setSelectedSlots([]);
  }, [roomId, selectedDate]);

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;

    let newSelected: string[];
    if (multiSelect) {
      if (selectedSlots.includes(slot.id)) {
        newSelected = selectedSlots.filter((id) => id !== slot.id);
      } else {
        newSelected = [...selectedSlots, slot.id];
      }
    } else {
      newSelected = selectedSlots.includes(slot.id) ? [] : [slot.id];
    }

    setSelectedSlots(newSelected);
    if (onSelect) {
      const selectedSlotData = slots.filter((s) => newSelected.includes(s.id));
      onSelect(selectedSlotData);
    }
  };

  const handleDateChange = (date: string) => {
    if (!isControlled) {
      setInnerDate(date);
    }
    onDateChange?.(date);
  };

  return (
    <View className={styles.pickerContainer}>
      <View className={styles.dateSelector}>
        {dateList.map((item) => (
          <View
            key={item.date}
            className={classnames(styles.dateItem, selectedDate === item.date && styles.active)}
            onClick={() => handleDateChange(item.date)}
          >
            <Text className={styles.weekday}>{item.weekday}</Text>
            <Text className={styles.day}>{item.day}</Text>
          </View>
        ))}
      </View>

      <Text className={styles.slotsTitle}>选择时间段</Text>

      <View className={styles.slotsGrid}>
        {slots.map((slot) => (
          <View
            key={slot.id}
            className={classnames(
              styles.slotItem,
              styles[slot.status],
              selectedSlots.includes(slot.id) && styles.selected,
              slot.status !== 'available' && styles.disabled
            )}
            onClick={() => handleSlotClick(slot)}
          >
            <Text className={styles.timeText}>
              {slot.startTime}
            </Text>
          </View>
        ))}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={classnames(styles.dot, styles.dotAvailable)}></View>
          <Text className={styles.text}>可预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.dot, styles.dotBooked)}></View>
          <Text className={styles.text}>已预约</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={classnames(styles.dot, styles.dotOccupied)}></View>
          <Text className={styles.text}>使用中</Text>
        </View>
      </View>
    </View>
  );
};

export default TimeSlotPicker;
