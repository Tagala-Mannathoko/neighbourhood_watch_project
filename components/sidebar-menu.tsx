import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SidebarMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  onPress?: () => void;
}

export function SidebarMenu({ visible, onClose }: SidebarMenuProps) {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const menuItems: MenuItem[] = [
    { title: 'Dashboard', icon: 'home', route: '/(tabs)' },
    { title: 'Patrol Monitoring', icon: 'walk', route: '/(tabs)/patrol' },
    { title: 'Emergency Alerts', icon: 'alert-circle', route: '/(tabs)/alerts' },
    { title: 'Community', icon: 'people', route: '/(tabs)/community' },
    { title: 'Reports & Analytics', icon: 'document-text', route: '/(tabs)/reports' },
  ];

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.onPress) {
      item.onPress();
    } else {
      router.push(item.route as any);
    }
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sidebar,
                {
                  backgroundColor: isDark ? Colors.dark.cardBackground : '#fff',
                  borderRightColor: isDark ? Colors.dark.border : '#e0e0e0',
                },
              ]}
            >
              {/* User Profile Section */}
              <View style={styles.profileSection}>
                <View style={[styles.avatar, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.userName}>
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.name || 'User'}
                </ThemedText>
                <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
                <ThemedText style={styles.userRole}>Security Officer</ThemedText>
              </View>

              {/* Menu Items */}
              <View style={styles.menuSection}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: isDark ? Colors.dark.background : 'transparent',
                      },
                    ]}
                    onPress={() => handleMenuItemPress(item)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={Colors[colorScheme ?? 'light'].tint}
                      style={styles.menuIcon}
                    />
                    <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors[colorScheme ?? 'light'].icon}
                      style={styles.chevron}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: '#ff4444' }]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={24} color="#fff" style={styles.signOutIcon} />
                <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 60,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  menuSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
  },
  chevron: {
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
