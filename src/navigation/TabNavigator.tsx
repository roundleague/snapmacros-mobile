import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Dashboard from '../screens/Dashboard';
import History from '../screens/History';
import Coach from '../screens/Coach';
import Settings from '../screens/Settings';
import LogStackNavigator from './LogStackNavigator';

const Tab = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'grid',         inactive: 'grid-outline' },
  Log:       { active: 'add-circle',   inactive: 'add-circle-outline' },
  History:   { active: 'time',         inactive: 'time-outline' },
  Coach:     { active: 'chatbubble',   inactive: 'chatbubble-outline' },
  Settings:  { active: 'settings',     inactive: 'settings-outline' },
};

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
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = icons ? (focused ? icons.active : icons.inactive) : 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
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
