import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../services/api';

const CATEGORY_ICONS: { [key: string]: string } = {
  mobility: '🚗',
  errands: '📦',
  food: '🍲',
  borrow_lend: '🔄',
  care: '👶',
  muscle: '💪',
  presence: '🫂',
  practical_skills: '🔧',
};

const CATEGORY_COLORS: { [key: string]: string } = {
  mobility: '#4b6368',
  errands: '#3c6a35',
  food: '#865406',
  borrow_lend: '#5d3800',
  care: '#376430',
  muscle: '#694000',
  presence: '#475f64',
  practical_skills: '#5a3f35',
};

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setIsLoading(true);
      const data = await api.getRequest(id as string);
      setRequest(data);
    } catch (error) {
      console.error('Failed to fetch request:', error);
      Alert.alert('Error', 'Failed to load request details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Request not found</Text>
      </SafeAreaView>
    );
  }

  const categoryColor = CATEGORY_COLORS[request.category] || '#3c6a35';
  const categoryIcon = CATEGORY_ICONS[request.category] || '📌';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColor + '20' },
          ]}
        >
          <Text style={styles.categoryIcon}>{categoryIcon}</Text>
          <Text style={[styles.categoryLabel, { color: categoryColor }]}>
            {request.category.toUpperCase()}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{request.title}</Text>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{request.description}</Text>

        {/* Details */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {request.location_name || 'Not specified'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Urgency:</Text>
            <Text style={styles.detailValue}>
              {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Posted:</Text>
            <Text style={styles.detailValue}>
              {new Date(request.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Help Button */}
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Offer Help</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3c6a35',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#303429',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#303429',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
    marginTop: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#5d6054',
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5d6054',
  },
  detailValue: {
    fontSize: 13,
    color: '#303429',
    fontWeight: '600',
  },
  helpButton: {
    backgroundColor: '#3c6a35',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#a73b21',
    textAlign: 'center',
    marginTop: 20,
  },
});
