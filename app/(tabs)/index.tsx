import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AlertCard } from '@/components/alert-card';
import { SidebarMenu } from '@/components/sidebar-menu';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ZoneCard } from '@/components/zone-card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

export default function DashboardScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [alertsData, zonesData, statsData] = await Promise.all([
        api.getAlerts().catch(() => []),
        api.getZones().catch(() => []),
        api.getStatistics().catch(() => ({})),
      ]);

      setAlerts(alertsData.slice(0, 5)); // Show top 5 alerts
      setZones(zonesData);
      setStatistics(statsData);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (authLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.greeting}>
              Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
            </ThemedText>
            <ThemedText style={styles.subtitle}>Neighbourhood Watch Dashboard</ThemedText>
          </View>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? Colors.dark.cardBackground : '#f5f5f5' }]}>
          <Ionicons name="search" size={20} color={Colors[colorScheme ?? 'light'].icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Search alerts, officers, or locations..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Dashboard Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}
            onPress={() => router.push('/(tabs)/patrol')}
          >
            <Ionicons name="map" size={32} color="#4CAF50" />
            <ThemedText style={styles.gridCardText}>Live Patrol Maps</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <Ionicons name="analytics" size={32} color="#2196F3" />
            <ThemedText style={styles.gridCardText}>Patrol Trends</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}
            onPress={() => router.push('/(tabs)/alerts')}
          >
            <Ionicons name="alert-circle" size={32} color="#FF5722" />
            <ThemedText style={styles.gridCardText}>Active Alerts</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}
            onPress={() => router.push('/(tabs)/patrol')}
          >
            <Ionicons name="qr-code" size={32} color="#9C27B0" />
            <ThemedText style={styles.gridCardText}>Scan Option</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Statistics Bar */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Active Alerts"
            value={statistics.activeAlerts || alerts.filter(a => a.status?.status_name === 'Active').length || 0}
            icon={<Ionicons name="alert-circle" size={24} color="#FF5722" />}
            onPress={() => router.push('/(tabs)/alerts')}
          />
          <StatCard
            label="Active Officers"
            value={statistics.activeOfficers || 0}
            icon={<Ionicons name="people" size={24} color="#2196F3" />}
          />
          <StatCard
            label="Weekly Patrols"
            value={statistics.weeklyPatrols || 0}
            icon={<Ionicons name="walk" size={24} color="#4CAF50" />}
          />
        </View>

        {/* Active Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Active Alerts
        </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')}>
              <ThemedText style={styles.seeAll}>See All</ThemedText>
        </TouchableOpacity>
          </View>
          {alerts.length === 0 ? (
            <ThemedText style={styles.emptyText}>No active alerts</ThemedText>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.alert_id}
                alert={alert}
                onPress={() => router.push(`/alert-details?id=${alert.alert_id}`)}
              />
            ))
          )}
        </View>

        {/* Active Zones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Active Zones
        </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/patrol')}>
              <ThemedText style={styles.seeAll}>Live Map</ThemedText>
            </TouchableOpacity>
          </View>
          {zones.length === 0 ? (
            <ThemedText style={styles.emptyText}>No zones available</ThemedText>
          ) : (
            zones.map((zone) => (
              <ZoneCard key={zone.zone_id} zone={zone} onPress={() => router.push(`/zone-details?id=${zone.zone_id}`)} />
            ))
          )}
        </View>
      </ScrollView>
      <SidebarMenu visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gridCardText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    padding: 20,
  },
});