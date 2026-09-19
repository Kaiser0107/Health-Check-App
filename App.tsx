import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider } from './context/AppContext';

// Import all screens directly for Snack & universal compatibility
import DashboardScreen from './app/(tabs)/index';
import MyInfoScreen from './app/(tabs)/my-info';
import LogHealthScreen from './app/(tabs)/log-health';
import HistoryScreen from './app/(tabs)/history';
import SettingsScreen from './app/(tabs)/settings';

type TabName = 'dashboard' | 'my-info' | 'log-health' | 'history' | 'settings';

interface TabItem {
  id: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'heart' },
  { id: 'my-info', label: 'My Info', icon: 'person' },
  { id: 'log-health', label: 'Log Health', icon: 'add-circle' },
  { id: 'history', label: 'History', icon: 'bar-chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'my-info':
        return <MyInfoScreen />;
      case 'log-health':
        return <LogHealthScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <SafeAreaView style={styles.container}>
          {/* Active Screen Content */}
          <View style={styles.screenContainer}>{renderActiveScreen()}</View>

          {/* Bottom Tab Bar */}
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const iconName = isActive
                ? tab.icon
                : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap);

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.id)}
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={isActive ? '#2563eb' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive ? styles.tabLabelActive : null,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    color: '#94a3b8',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
