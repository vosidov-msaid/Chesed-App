import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Responsive tab bar height based on screen
  const isSmallScreen = height < 700;
  const tabBarHeight = isSmallScreen ? 65 : 75;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3c6a35',
        tabBarInactiveTintColor: '#b1b3a5',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e4d4',
          borderTopWidth: 1,
          paddingBottom: Math.max(12, insets.bottom),
          paddingTop: 8,
          paddingLeft: 0,
          paddingRight: 0,
          height: tabBarHeight + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: '#fafaf0',
          borderBottomColor: '#e2e4d4',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#303429',
        },
        headerTintColor: '#3c6a35',
      }}
    >
      <Tabs.Screen
        name="(tabs)"
        options={{
          title: 'Chesed',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarLabel: 'Post',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
