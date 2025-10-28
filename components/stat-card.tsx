import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, onPress }: StatCardProps) {
  return (
    <Card onPress={onPress} style={styles.statCard}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <ThemedText type="title" style={styles.value}>
        {value}
      </ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    margin: 4,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
