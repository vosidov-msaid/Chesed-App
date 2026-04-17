import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf0' }}>
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#303429', marginBottom: 32 }}>
          Profile
        </Text>

        {/* User Info */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#797c6f', marginBottom: 8 }}>
            Name
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#303429', marginBottom: 16 }}>
            {user?.first_name} {user?.last_name}
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#797c6f', marginBottom: 8 }}>
            Phone
          </Text>
          <Text style={{ fontSize: 16, color: '#303429', marginBottom: 16 }}>
            {user?.phone_number}
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#797c6f', marginBottom: 8 }}>
            Email
          </Text>
          <Text style={{ fontSize: 16, color: '#303429', marginBottom: 16 }}>
            {user?.email}
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#797c6f', marginBottom: 8 }}>
            Reputation Score
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#3c6a35' }}>
            {user?.reputation_score}
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={{
            height: 48,
            borderRadius: 12,
            backgroundColor: '#a73b21',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleLogout}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
