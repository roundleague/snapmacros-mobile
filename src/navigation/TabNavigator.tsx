import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import Dashboard from '../screens/Dashboard';
import History from '../screens/History';
import Coach from '../screens/Coach';
import Settings from '../screens/Settings';
import LogStackNavigator from './LogStackNavigator';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⊙', Log: '＋', History: '◫', Coach: '💬', Settings: '⚙',
  };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
      {icons[name] ?? '•'}
    </Text>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Log" component={LogStackNavigator} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Coach" component={Coach} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}
