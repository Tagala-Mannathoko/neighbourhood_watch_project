import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private async getHeaders() {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  // ========== ALERTS ==========
  async getAlerts() {
    return this.request<any[]>('/alerts');
  }

  async getAlertById(alertId: number) {
    return this.request<any>(`/alerts/${alertId}`);
  }

  async createAlert(alert: { title: string; description: string; priority_id: number; location: string }) {
    return this.request<any>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async updateAlertStatus(alertId: number, statusId: number) {
    return this.request<any>(`/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status_id: statusId }),
    });
  }

  // ========== PATROLS ==========
  async getPatrols() {
    return this.request<any[]>('/patrols');
  }

  async createPatrol(patrol: { zone_id: number; comments?: string }) {
    return this.request<any>('/patrols', {
      method: 'POST',
      body: JSON.stringify(patrol),
    });
  }

  async endPatrol(patrolId: number) {
    return this.request<any>(`/patrols/${patrolId}/end`, {
      method: 'PATCH',
    });
  }

  async getScans(patrolId?: number) {
    const endpoint = patrolId ? `/scans?patrol_id=${patrolId}` : '/scans';
    return this.request<any[]>(endpoint);
  }

  async createScan(scan: { patrol_id: number; checkpoint_id: number; notes?: string }) {
    return this.request<any>('/scans', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
  }

  // ========== ZONES ==========
  async getZones() {
    return this.request<any[]>('/zones');
  }

  async updateZoneStatus(zoneId: number, status: string) {
    return this.request<any>(`/zones/${zoneId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ========== CHECKPOINTS ==========
  async getCheckpoints(zoneId?: number) {
    const endpoint = zoneId ? `/checkpoints?zone_id=${zoneId}` : '/checkpoints';
    return this.request<any[]>(endpoint);
  }

  // ========== COMMUNITY ==========
  async getEvents() {
    return this.request<any[]>('/events');
  }

  async getConcerns() {
    return this.request<any[]>('/concerns');
  }

  async updateConcernStatus(concernId: number, status: string) {
    return this.request<any>(`/concerns/${concernId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async sendMessage(message: { message_text: string }) {
    return this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async getResidents() {
    return this.request<any[]>('/residents');
  }

  // ========== REPORTS ==========
  async getReports(filters?: { type?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const query = params.toString();
    return this.request<any[]>(`/reports${query ? `?${query}` : ''}`);
  }

  async generateReport(report: { report_title: string; report_type: string; period_start: string; period_end: string }) {
    return this.request<any>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  // ========== STATISTICS ==========
  async getStatistics() {
    return this.request<any>('/statistics');
  }

  // ========== ALERT PRIORITIES & STATUSES ==========
  async getAlertPriorities() {
    return this.request<any[]>('/alert-priorities');
  }

  async getAlertStatuses() {
    return this.request<any[]>('/alert-statuses');
  }
}

export const api = new ApiService();
