import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { AlertCard } from '@/components/alert-card';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, PriorityColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

export default function AlertsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [alerts, setAlerts] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({ total: 0, active: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newAlert, setNewAlert] = useState({ title: '', description: '', priority_id: 1, location: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAlertsData();
    }
  }, [isAuthenticated]);

  const loadAlertsData = async () => {
    try {
      setLoading(true);
      const [alertsData, prioritiesData, statusesData] = await Promise.all([
        api.getAlerts().catch(() => []),
        api.getAlertPriorities().catch(() => []),
        api.getAlertStatuses().catch(() => []),
      ]);

      setAlerts(alertsData);
      setPriorities(prioritiesData);
      setStatuses(statusesData);

      const activeCount = alertsData.filter((a: any) => a.status?.status_name === 'Active').length;
      const inProgressCount = alertsData.filter(
        (a: any) => a.status?.status_name === 'Under Investigation'
      ).length;

      setStatistics({
        total: alertsData.length,
        active: activeCount,
        inProgress: inProgressCount,
      });
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlertsData();
  };

  const handleCreateAlert = async () => {
    if (!newAlert.title || !newAlert.description || !newAlert.location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await api.createAlert(newAlert);
      setShowReportModal(false);
      setNewAlert({ title: '', description: '', priority_id: 1, location: '' });
      loadAlertsData();
      Alert.alert('Success', 'Alert reported successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create alert');
    }
  };

  const updateAlertStatus = async (alertId: number, statusId: number) => {
    try {
      await api.updateAlertStatus(alertId, statusId);
      loadAlertsData();
      Alert.alert('Success', 'Alert status updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <ThemedText type="title" style={styles.title}>
            Emergency Alerts
          </ThemedText>
          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => Alert.alert('Map View', 'Map view would open here')}
          >
            <Ionicons name="map-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Total Alerts"
            value={statistics.total}
            icon={<Ionicons name="alert-circle" size={24} color="#FF5722" />}
          />
          <StatCard
            label="Active"
            value={statistics.active}
            icon={<Ionicons name="warning" size={24} color="#ff4444" />}
          />
          <StatCard
            label="In Progress"
            value={statistics.inProgress}
            icon={<Ionicons name="time" size={24} color="#ff8800" />}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => setShowReportModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Report New Alert</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? Colors.dark.cardBackground : '#f0f0f0' }]}
            onPress={() => Alert.alert('Map View', 'Map view would open here')}
          >
            <Ionicons name="map" size={24} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              View Map
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Alerts List */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Active Alerts
          </ThemedText>
          {alerts.length === 0 ? (
            <ThemedText style={styles.emptyText}>No alerts found</ThemedText>
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
      </ScrollView>

      {/* Report Alert Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Report New Alert
            </ThemedText>

            <ThemedText style={styles.modalLabel}>Title *</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                },
              ]}
              placeholder="Enter alert title"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newAlert.title}
              onChangeText={(text) => setNewAlert({ ...newAlert, title: text })}
            />

            <ThemedText style={styles.modalLabel}>Description *</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                  minHeight: 100,
                },
              ]}
              placeholder="Enter alert description"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newAlert.description}
              onChangeText={(text) => setNewAlert({ ...newAlert, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <ThemedText style={styles.modalLabel}>Location *</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                },
              ]}
              placeholder="Enter location"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newAlert.location}
              onChangeText={(text) => setNewAlert({ ...newAlert, location: text })}
            />

            <ThemedText style={styles.modalLabel}>Priority</ThemedText>
            <View style={styles.priorityButtons}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.priority_id}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor:
                        newAlert.priority_id === priority.priority_id
                          ? PriorityColors[priority.level as keyof typeof PriorityColors] || '#888'
                          : isDark
                            ? Colors.dark.border
                            : '#f0f0f0',
                    },
                  ]}
                  onPress={() => setNewAlert({ ...newAlert, priority_id: priority.priority_id })}
                >
                  <ThemedText
                    style={[
                      styles.priorityButtonText,
                      {
                        color:
                          newAlert.priority_id === priority.priority_id ? '#fff' : Colors[colorScheme ?? 'light'].text,
                      },
                    ]}
                  >
                    {priority.level}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowReportModal(false);
                  setNewAlert({ title: '', description: '', priority_id: 1, location: '' });
                }}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleCreateAlert}>
                <ThemedText style={styles.modalButtonText}>Submit</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  title: {
    fontSize: 28,
  },
  mapButton: {
    padding: 12,
    borderRadius: 12,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  priorityButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
