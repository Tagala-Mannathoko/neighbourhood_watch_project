import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PriorityColors, StatusColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, View } from 'react-native';

interface AlertCardProps {
  alert: {
    alert_id: number;
    title: string;
    description?: string;
    priority?: { level: string };
    status?: { status_name: string };
    location?: string;
    created_at?: string;
  };
  onPress?: () => void;
}

export function AlertCard({ alert, onPress }: AlertCardProps) {
  const colorScheme = useColorScheme();
  const priorityLevel = alert.priority?.level || 'LOW';
  const statusName = alert.status?.status_name || 'Active';
  
  const priorityColor = PriorityColors[priorityLevel as keyof typeof PriorityColors] || PriorityColors.LOW;
  const statusColor = StatusColors[statusName as keyof typeof StatusColors] || StatusColors.Active;

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
          {alert.title}
        </ThemedText>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
          <ThemedText style={styles.badgeText}>{priorityLevel}</ThemedText>
        </View>
      </View>
      {alert.description && (
        <ThemedText style={styles.description} numberOfLines={2}>
          {alert.description}
        </ThemedText>
      )}
      <View style={styles.footer}>
        {alert.location && (
          <ThemedText style={styles.location} numberOfLines={1}>
            📍 {alert.location}
          </ThemedText>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <ThemedText style={styles.badgeText}>{statusName}</ThemedText>
        </View>
      </View>
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
  title: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
