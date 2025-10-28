import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { StatusColors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

interface ZoneCardProps {
  zone: {
    zone_id: number;
    zone_name: string;
    status: string;
    description?: string;
  };
  onPress?: () => void;
}

export function ZoneCard({ zone, onPress }: ZoneCardProps) {
  const statusColor = StatusColors[zone.status as keyof typeof StatusColors] || StatusColors.Unpatrolled;

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.zoneName}>
          {zone.zone_name}
        </ThemedText>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      {zone.description && (
        <ThemedText style={styles.description} numberOfLines={2}>
          {zone.description}
        </ThemedText>
      )}
      <ThemedText style={styles.status}>Status: {zone.status}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 16,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  status: {
    fontSize: 12,
    opacity: 0.7,
  },
});
