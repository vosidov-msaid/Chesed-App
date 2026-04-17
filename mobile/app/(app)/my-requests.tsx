import { View, Text, SafeAreaView } from 'react-native';

export default function MyRequestsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf0' }}>
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#303429', marginBottom: 8 }}>
          My Requests
        </Text>
        <Text style={{ fontSize: 16, color: '#797c6f', marginBottom: 32 }}>
          Your posted requests
        </Text>

        <View style={{
          flex: 1,
          borderRadius: 12,
          backgroundColor: '#f4f4e9',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#b1b3a5', fontSize: 16 }}>
            Your requests will appear here... 📝
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
