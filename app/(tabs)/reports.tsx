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
    View
} from 'react-native';

import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

type FilterType = 'All Data' | 'Patrols' | 'Alerts' | 'Incidents';
type DateRange = 'Today' | 'This Week' | 'This Month' | 'This Year';

export default function ReportsScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [analytics, setAnalytics] = useState({
    totalPatrols: 0,
    totalAlerts: 0,
    resolvedIncidents: 0,
    activeOfficers: 0,
    averageResponseTime: '0 min',
    patrolEfficiency: '0%',
  });
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('All Data');
  const [dateRange, setDateRange] = useState<DateRange>('This Month');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    report_title: '',
    report_type: 'Weekly Patrol Summary',
    period_start: '',
    period_end: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReportsData();
    }
  }, [isAuthenticated, filterType, dateRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const { startDate, endDate } = getDateRange(dateRange);
      
      // Load statistics and reports
      const [statsData, reportsData] = await Promise.all([
        api.getStatistics().catch(() => ({})),
        api.getReports({ type: filterType !== 'All Data' ? filterType : undefined, startDate, endDate }).catch(() => []),
      ]);

      setAnalytics({
        totalPatrols: statsData.totalPatrols || 0,
        totalAlerts: statsData.totalAlerts || 0,
        resolvedIncidents: statsData.resolvedIncidents || 0,
        activeOfficers: statsData.activeOfficers || 0,
        averageResponseTime: statsData.averageResponseTime || '0 min',
        patrolEfficiency: statsData.patrolEfficiency || '0%',
      });

      setReports(reportsData);
    } catch (error: any) {
      console.error('Error loading reports data:', error);
      Alert.alert('Error', 'Failed to load reports data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDateRange = (range: DateRange) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = today.toISOString().split('T')[0];

    switch (range) {
      case 'Today':
        startDate = today;
        break;
      case 'This Week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'This Year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate,
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportsData();
  };

  const handleGenerateReport = async () => {
    if (!newReport.report_title || !newReport.period_start || !newReport.period_end) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await api.generateReport(newReport);
      setShowGenerateModal(false);
      setNewReport({
        report_title: '',
        report_type: 'Weekly Patrol Summary',
        period_start: '',
        period_end: '',
      });
      loadReportsData();
      Alert.alert('Success', 'Report generated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate report');
    }
  };

  const downloadReport = (report: any) => {
    Alert.alert('Download Report', `Downloading ${report.report_title}...`, [
      { text: 'OK' },
    ]);
  };

  const exportReport = (report: any, format: 'PDF' | 'Excel') => {
    Alert.alert('Export Report', `Exporting ${report.report_title} as ${format}...`, [
      { text: 'OK' },
    ]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
            Reports & Analytics
          </ThemedText>
        </View>

        {/* Analytics Cards */}
        <View style={styles.analyticsContainer}>
          <StatCard
            label="Total Patrols"
            value={analytics.totalPatrols}
            icon={<Ionicons name="walk" size={24} color="#4CAF50" />}
          />
          <StatCard
            label="Total Alerts"
            value={analytics.totalAlerts}
            icon={<Ionicons name="alert-circle" size={24} color="#FF5722" />}
          />
          <StatCard
            label="Resolved"
            value={analytics.resolvedIncidents}
            icon={<Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
          />
          <StatCard
            label="Active Officers"
            value={analytics.activeOfficers}
            icon={<Ionicons name="people" size={24} color="#2196F3" />}
          />
          <StatCard
            label="Avg Response"
            value={analytics.averageResponseTime}
            icon={<Ionicons name="time" size={24} color="#FF9800" />}
          />
          <StatCard
            label="Efficiency"
            value={analytics.patrolEfficiency}
            icon={<Ionicons name="trending-up" size={24} color="#9C27B0" />}
          />
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Filters
          </ThemedText>
          <View style={styles.filterContainer}>
            <View style={styles.filterRow}>
              <ThemedText style={styles.filterLabel}>Type:</ThemedText>
              <View style={styles.filterButtons}>
                {(['All Data', 'Patrols', 'Alerts', 'Incidents'] as FilterType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          filterType === type
                            ? Colors[colorScheme ?? 'light'].tint
                            : isDark
                              ? Colors.dark.border
                              : '#f0f0f0',
                      },
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <ThemedText
                      style={[
                        styles.filterButtonText,
                        {
                          color:
                            filterType === type ? '#fff' : Colors[colorScheme ?? 'light'].text,
                        },
                      ]}
                    >
                      {type}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterRow}>
              <ThemedText style={styles.filterLabel}>Date Range:</ThemedText>
              <View style={styles.filterButtons}>
                {(['Today', 'This Week', 'This Month', 'This Year'] as DateRange[]).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          dateRange === range
                            ? Colors[colorScheme ?? 'light'].tint
                            : isDark
                              ? Colors.dark.border
                              : '#f0f0f0',
                      },
                    ]}
                    onPress={() => setDateRange(range)}
                  >
                    <ThemedText
                      style={[
                        styles.filterButtonText,
                        {
                          color: dateRange === range ? '#fff' : Colors[colorScheme ?? 'light'].text,
                        },
                      ]}
                    >
                      {range}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Generate Report Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => setShowGenerateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <ThemedText style={styles.generateButtonText}>Generate Custom Report</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Reports
          </ThemedText>
          {reports.length === 0 ? (
            <ThemedText style={styles.emptyText}>No reports found</ThemedText>
          ) : (
            reports.map((report) => (
              <Card key={report.report_id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.reportTitle}>
                      {report.report_title}
                    </ThemedText>
                    <ThemedText style={styles.reportType}>{report.report_type}</ThemedText>
                    <ThemedText style={styles.reportDate}>
                      {formatDate(report.period_start)} - {formatDate(report.period_end)}
                    </ThemedText>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}
                      onPress={() => downloadReport(report)}
                    >
                      <Ionicons name="download" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}
                      onPress={() => exportReport(report, 'PDF')}
                    >
                      <Ionicons name="document-text" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}
                      onPress={() => exportReport(report, 'Excel')}
                    >
                      <Ionicons name="grid" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
                <ThemedText style={styles.reportCreated}>
                  Created: {formatDate(report.created_at)}
                </ThemedText>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Generate Report Modal */}
      <Modal visible={showGenerateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: isDark ? Colors.dark.cardBackground : '#fff' }]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Generate Custom Report
            </ThemedText>

            <ThemedText style={styles.modalLabel}>Report Title *</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                },
              ]}
              placeholder="Enter report title"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newReport.report_title}
              onChangeText={(text) => setNewReport({ ...newReport, report_title: text })}
            />

            <ThemedText style={styles.modalLabel}>Report Type</ThemedText>
            <View style={styles.reportTypeButtons}>
              {['Weekly Patrol Summary', 'Emergency Response Analysis', 'Monthly Activity Report'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reportTypeButton,
                    {
                      backgroundColor:
                        newReport.report_type === type
                          ? Colors[colorScheme ?? 'light'].tint
                          : isDark
                            ? Colors.dark.border
                            : '#f0f0f0',
                    },
                  ]}
                  onPress={() => setNewReport({ ...newReport, report_type: type })}
                >
                  <ThemedText
                    style={[
                      styles.reportTypeButtonText,
                      {
                        color:
                          newReport.report_type === type ? '#fff' : Colors[colorScheme ?? 'light'].text,
                      },
                    ]}
                  >
                    {type}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.modalLabel}>Period Start *</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newReport.period_start}
              onChangeText={(text) => setNewReport({ ...newReport, period_start: text })}
            />

            <ThemedText style={styles.modalLabel}>Period End *</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: isDark ? Colors.dark.border : '#e0e0e0',
                  backgroundColor: isDark ? Colors.dark.background : '#f9f9f9',
                },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={newReport.period_end}
              onChangeText={(text) => setNewReport({ ...newReport, period_end: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowGenerateModal(false);
                  setNewReport({
                    report_title: '',
                    report_type: 'Weekly Patrol Summary',
                    period_start: '',
                    period_end: '',
                  });
                }}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleGenerateReport}>
                <ThemedText style={styles.modalButtonText}>Generate</ThemedText>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
  },
  analyticsContainer: {
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
  filterContainer: {
    gap: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  reportType: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCreated: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
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
  reportTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reportTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
