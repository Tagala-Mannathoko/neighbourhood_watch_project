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

import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors, StatusColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

export default function CommunityScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [events, setEvents] = useState<any[]>([]);
  const [concerns, setConcerns] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({ activeResidents: 0, pendingConcerns: 0, upcomingEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCommunityData();
    }
  }, [isAuthenticated]);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [eventsData, concernsData, residentsData] = await Promise.all([
        api.getEvents().catch(() => []),
        api.getConcerns().catch(() => []),
        api.getResidents().catch(() => []),
      ]);

      setEvents(eventsData);
      setConcerns(concernsData.slice(0, 10)); // Show recent concerns

      const pendingConcernsCount = concernsData.filter(
        (c: any) => c.status === 'Under Review' || c.status === 'In Progress'
      ).length;

      setStatistics({
        activeResidents: residentsData.length || 0,
        pendingConcerns: pendingConcernsCount,
        upcomingEvents: eventsData.filter((e: any) => {
          const eventDate = new Date(e.event_date);
          return eventDate >= new Date();
        }).length,
      });
    } catch (error: any) {
      console.error('Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCommunityData();
  };

  const sendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      await api.sendMessage({ message_text: messageText });
      setMessageText('');
      setShowMessageModal(false);
      Alert.alert('Success', 'Message broadcasted to community');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const updateConcernStatus = async (concernId: number, status: string) => {
    try {
      await api.updateConcernStatus(concernId, status);
      loadCommunityData();
      Alert.alert('Success', 'Concern status updated');
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
            Community
          </ThemedText>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Active Residents"
            value={statistics.activeResidents}
            icon={<Ionicons name="people" size={24} color="#2196F3" />}
            onPress={() => Alert.alert('Residents', 'View all residents')}
          />
          <StatCard
            label="Pending Concerns"
            value={statistics.pendingConcerns}
            icon={<Ionicons name="clipboard" size={24} color="#FF9800" />}
          />
          <StatCard
            label="Upcoming Events"
            value={statistics.upcomingEvents}
            icon={<Ionicons name="calendar" size={24} color="#4CAF50" />}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => setShowMessageModal(true)}
          >
            <Ionicons name="megaphone" size={24} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Quick Message</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? Colors.dark.cardBackground : '#f0f0f0' }]}
            onPress={() => Alert.alert('Schedule Meeting', 'Schedule community meeting')}
          >
            <Ionicons name="calendar-outline" size={24} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Schedule Meeting
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? Colors.dark.cardBackground : '#f0f0f0' }]}
            onPress={() => api.getResidents().then(() => Alert.alert('Residents', 'Viewing all residents'))}
          >
            <Ionicons name="people-outline" size={24} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              View All Residents
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Community Updates */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Upcoming Events
          </ThemedText>
          {events.length === 0 ? (
            <ThemedText style={styles.emptyText}>No upcoming events</ThemedText>
          ) : (
            events
              .filter((e: any) => {
                const eventDate = new Date(e.event_date);
                return eventDate >= new Date();
              })
              .slice(0, 5)
              .map((event) => (
                <Card key={event.event_id} style={styles.eventCard}>
                  <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
                    {event.title}
                  </ThemedText>
                  {event.description && (
                    <ThemedText style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </ThemedText>
                  )}
                  <View style={styles.eventFooter}>
                    <ThemedText style={styles.eventDate}>📅 {formatDate(event.event_date)}</ThemedText>
                    {event.location && (
                      <ThemedText style={styles.eventLocation}>📍 {event.location}</ThemedText>
                    )}
                  </View>
                </Card>
              ))
          )}
        </View>

        {/* Recent Interactions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Interactions
          </ThemedText>
          {concerns.length === 0 ? (
            <ThemedText style={styles.emptyText}>No concerns reported</ThemedText>
          ) : (
            concerns.map((concern) => (
              <Card key={concern.concern_id} style={styles.concernCard}>
                <View style={styles.concernHeader}>
                  <View style={styles.concernInfo}>
                    <ThemedText type="defaultSemiBold">
                      {concern.resident?.full_name || 'Anonymous Resident'}
                    </ThemedText>
                    {concern.resident?.address && (
                      <ThemedText style={styles.concernLocation}>📍 {concern.resident.address}</ThemedText>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          StatusColors[concern.status as keyof typeof StatusColors] || StatusColors['Under Review'],
                      },
                    ]}
                  >
                    <ThemedText style={styles.statusText}>{concern.status}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.concernDescription}>{concern.description}</ThemedText>
                <ThemedText style={styles.concernDate}>{formatDate(concern.created_at)}</ThemedText>
                {concern.status !== 'Resolved' && (
                  <View style={styles.concernActions}>
                    <TouchableOpacity
                      style={[styles.statusButton, { backgroundColor: '#4CAF50' }]}
                      onPress={() => updateConcernStatus(concern.concern_id, 'Resolved')}
                    >
                      <ThemedText style={styles.statusButtonText}>Mark Resolved</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Message Modal */}
      <Modal visible={showMessageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Broadcast Message
            </ThemedText>
            <ThemedText style={styles.modalLabel}>Message:</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                  minHeight: 120,
                },
              ]}
              placeholder="Enter message to broadcast..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowMessageModal(false);
                  setMessageText('');
                }}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={sendMessage}>
                <ThemedText style={styles.modalButtonText}>Send</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
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
  eventCard: {
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eventDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  eventLocation: {
    fontSize: 12,
    opacity: 0.7,
  },
  concernCard: {
    marginBottom: 12,
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  concernInfo: {
    flex: 1,
    marginRight: 8,
  },
  concernLocation: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  concernDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  concernDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  concernActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
