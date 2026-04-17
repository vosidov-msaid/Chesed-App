import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf0' }}>
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#303429', marginBottom: 8 }}>
          Welcome, {user?.first_name}!
        </Text>
        <Text style={{ fontSize: 16, color: '#797c6f', marginBottom: 32 }}>
          Discover favor requests in your community
        </Text>

        {/* Placeholder for Feed Content */}
        <View style={{
          flex: 1,
          borderRadius: 12,
          backgroundColor: '#f4f4e9',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#b1b3a5', fontSize: 16 }}>
            Feed coming next... 📜
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
