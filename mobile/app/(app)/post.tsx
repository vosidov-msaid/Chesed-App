import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function PostScreen() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const clusters = [
    { id: 'mobility', name: '🚗 Mobility', color: '#4b6368' },
    { id: 'errands', name: '📦 Errands & Logistics', color: '#3c6a35' },
    { id: 'food', name: '🍲 Food', color: '#865406' },
    { id: 'borrow', name: '🛠️ Borrow / Lend', color: '#5d3800' },
    { id: 'care', name: '👶 Care', color: '#376430' },
    { id: 'muscle', name: '💪 Muscle', color: '#694000' },
    { id: 'presence', name: '🫂 Presence', color: '#475f64' },
    { id: 'skills', name: '🔧 Practical Skills', color: '#5a3f35' },
  ];

  const handleStartRequest = () => {
    if (!selectedCluster) {
      Alert.alert('Please select a category first');
      return;
    }
    // TODO: Navigate to request form with selected cluster
    Alert.alert('Selected', `Creating request in: ${selectedCluster}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf0' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Start a New Request</Text>
          <Text style={styles.subtitle}>
            Choose what you need help with. Our community is here to help.
          </Text>
        </View>

        <View style={styles.clusterGrid}>
          {clusters.map((cluster) => (
            <TouchableOpacity
              key={cluster.id}
              style={[
                styles.clusterCard,
                selectedCluster === cluster.id && styles.clusterCardActive,
              ]}
              onPress={() => setSelectedCluster(cluster.id)}
            >
              <Text style={styles.clusterEmoji}>{cluster.name.split(' ')[0]}</Text>
              <Text
                style={[
                  styles.clusterName,
                  selectedCluster === cluster.id && styles.clusterNameActive,
                ]}
              >
                {cluster.name.split(' ').slice(1).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !selectedCluster && styles.submitButtonDisabled]}
          onPress={handleStartRequest}
          disabled={!selectedCluster}
        >
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#303429',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#797c6f',
    lineHeight: 24,
  },
  clusterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'space-between',
  },
  clusterCard: {
    width: '48%',
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e4d4',
    gap: 8,
  },
  clusterCardActive: {
    backgroundColor: '#b9eeab',
    borderColor: '#3c6a35',
  },
  clusterEmoji: {
    fontSize: 32,
  },
  clusterName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5d6054',
    textAlign: 'center',
  },
  clusterNameActive: {
    color: '#1a4716',
  },
  submitButton: {
    backgroundColor: '#3c6a35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#b1b3a5',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
