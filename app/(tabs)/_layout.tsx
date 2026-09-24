import { Tabs, Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconsName;
  focused: boolean;
  color: any;
  size: number;
}

function TabIcon({ name, focused, color, size }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={size}
      color={color}
    />
  );
}

export default function TabLayout() {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={layoutStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/splash" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#ffffff' } as any,
        headerShown: false,
      }}
    >
      {/* ─── Dashboard — both roles ─────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="heart" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* ─── Patients — admin only ──────────────────────────────────────── */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          href: isAdmin ? undefined : null, // hide tab for patients
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="people" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* ─── My Info — patient only (admin manages via Patients tab) ────── */}
      <Tabs.Screen
        name="my-info"
        options={{
          title: 'My Info',
          href: isAdmin ? null : undefined, // hide for admins
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="person" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* ─── Log Health — both roles ────────────────────────────────────── */}
      <Tabs.Screen
        name="log-health"
        options={{
          title: 'Log Health',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="add-circle" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* ─── History — both roles ───────────────────────────────────────── */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="bar-chart" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* ─── Settings — both roles ──────────────────────────────────────── */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="settings" focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const layoutStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

