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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

export default function PatrolScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [patrols, setPatrols] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [currentPatrol, setCurrentPatrol] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [patrolComment, setPatrolComment] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPatrolData();
    }
  }, [isAuthenticated]);

  const loadPatrolData = async () => {
    try {
      setLoading(true);
      const [patrolsData, scansData, zonesData] = await Promise.all([
        api.getPatrols().catch(() => []),
        api.getScans().catch(() => []),
        api.getZones().catch(() => []),
      ]);

      setPatrols(patrolsData);
      setScans(scansData.slice(0, 20)); // Show recent scans
      setZones(zonesData);

      // Find active patrol (no end_time)
      const active = patrolsData.find((p: any) => !p.end_time);
      setCurrentPatrol(active);
    } catch (error: any) {
      console.error('Error loading patrol data:', error);
      Alert.alert('Error', 'Failed to load patrol data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatrolData();
  };

  const startPatrol = async (zoneId: number) => {
    try {
      const newPatrol = await api.createPatrol({ zone_id: zoneId });
      setCurrentPatrol(newPatrol);
      setPatrols([...patrols, newPatrol]);
      Alert.alert('Success', 'Patrol started');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start patrol');
    }
  };

  const endPatrol = async () => {
    if (!currentPatrol) return;

    try {
      await api.endPatrol(currentPatrol.patrol_id);
      setCurrentPatrol(null);
      setPatrolComment('');
      setShowLogModal(false);
      loadPatrolData();
      Alert.alert('Success', 'Patrol ended');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to end patrol');
    }
  };

  const savePatrolComment = async () => {
    if (!currentPatrol) return;

    if (!patrolComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      // Update patrol with comment
      await api.endPatrol(currentPatrol.patrol_id);
      // In a real implementation, you'd update the patrol with the comment
      setPatrolComment('');
      setShowLogModal(false);
      loadPatrolData();
      Alert.alert('Success', 'Patrol logged');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save comment');
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
            Patrol Monitoring
          </ThemedText>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => Alert.alert('QR Scanner', 'QR Scanner functionality would open here')}
          >
            <Ionicons name="qr-code-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Patrol Logging Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Patrol Logging
          </ThemedText>
          {currentPatrol ? (
            <Card style={styles.patrolCard}>
              <View style={styles.patrolHeader}>
                <View>
                  <ThemedText type="defaultSemiBold">Active Patrol</ThemedText>
                  <ThemedText style={styles.patrolInfo}>
                    Zone: {zones.find((z) => z.zone_id === currentPatrol.zone_id)?.zone_name || 'Unknown'}
                  </ThemedText>
                  <ThemedText style={styles.patrolInfo}>Started: {formatDate(currentPatrol.start_time)}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.endButton, { backgroundColor: '#ff4444' }]}
                  onPress={() => setShowLogModal(true)}
                >
                  <ThemedText style={styles.endButtonText}>End Patrol</ThemedText>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <Card>
              <ThemedText style={styles.sectionText}>Start a new patrol by selecting a zone:</ThemedText>
              {zones.map((zone) => (
                <TouchableOpacity
                  key={zone.zone_id}
                  style={[styles.zoneButton, { backgroundColor: isDark ? Colors.dark.border : '#f0f0f0' }]}
                  onPress={() => startPatrol(zone.zone_id)}
                >
                  <ThemedText type="defaultSemiBold">{zone.zone_name}</ThemedText>
                  <ThemedText style={styles.zoneStatus}>Status: {zone.status}</ThemedText>
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </View>

        {/* Scan History Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Scan History
          </ThemedText>
          {scans.length === 0 ? (
            <ThemedText style={styles.emptyText}>No scans recorded yet</ThemedText>
          ) : (
            scans.map((scan, index) => (
              <Card key={scan.scan_id || index} style={styles.scanCard}>
                <View style={styles.scanHeader}>
                  <View style={styles.scanNumber}>
                    <ThemedText type="defaultSemiBold">Scan #{scan.scan_id || index + 1}</ThemedText>
                  </View>
                  <ThemedText style={styles.scanTime}>{formatDate(scan.scanned_at)}</ThemedText>
                </View>
                <ThemedText style={styles.scanLocation}>
                  Location: {scan.checkpoint?.checkpoint_name || 'Unknown Checkpoint'}
                </ThemedText>
                {scan.notes && <ThemedText style={styles.scanNotes}>{scan.notes}</ThemedText>}
                {scan.patrol?.zone && (
                  <ThemedText style={styles.scanZone}>Zone: {scan.patrol.zone.zone_name || 'N/A'}</ThemedText>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Back to Dashboard */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="home" size={20} color="#fff" />
          <ThemedText style={styles.backButtonText}>Back to Dashboard</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Patrol Logging Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Log Patrol
            </ThemedText>
            <ThemedText style={styles.modalLabel}>Comments:</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                },
              ]}
              placeholder="Enter patrol notes..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={patrolComment}
              onChangeText={setPatrolComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowLogModal(false);
                  setPatrolComment('');
                }}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={savePatrolComment}>
                <ThemedText style={styles.modalButtonText}>Save</ThemedText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
  },
  scanButton: {
    padding: 12,
    borderRadius: 12,
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
  sectionText: {
    marginBottom: 12,
  },
  patrolCard: {
    backgroundColor: '#e8f5e9',
  },
  patrolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patrolInfo: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  endButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  zoneButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  zoneStatus: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  scanCard: {
    marginBottom: 8,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanNumber: {
    flex: 1,
  },
  scanTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  scanLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  scanNotes: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
    fontStyle: 'italic',
  },
  scanZone: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
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
    minHeight: 100,
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
  saveButton: {
    backgroundColor: '#0a7ea4',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
