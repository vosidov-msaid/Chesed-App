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
import api from '../../../../services/api';
import { useGeolocation } from '../../../../utils/useGeolocation';
import { useAuthStore } from '../../../../store/authStore';

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
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams();
  const { location, requestLocation } = useGeolocation();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRequest();
    requestLocation();
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const getDistanceText = () => {
    if (!location || !request.latitude || !request.longitude) {
      return 'Distance not available';
    }
    const distance = calculateDistance(location.latitude, location.longitude, request.latitude, request.longitude);
    return `${distance} miles away`;
  };

  const getTimingDisplay = () => {
    if (request.urgency === 'high' || request.urgency === 'urgent') {
      return { icon: '⚡', text: 'Urgent - Now', color: '#a73b21' };
    }
    if (request.scheduled_at) {
      const date = new Date(request.scheduled_at);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { icon: '📅', text: `Scheduled: ${dateStr} at ${timeStr}`, color: '#797c6f' };
    }
    return { icon: '📅', text: 'Timing: Flexible', color: '#797c6f' };
  };

  const handleDeleteRequest = () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.deleteRequest(id as string);
              Alert.alert('Success', 'Request deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => router.push('/(app)/my-requests'),
                },
              ]);
            } catch (error) {
              console.error('Failed to delete request:', error);
              Alert.alert('Error', 'Failed to delete request');
              setIsDeleting(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

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
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{getDistanceText()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Urgency:</Text>
            <Text style={[styles.detailValue, { color: request.urgency === 'high' || request.urgency === 'urgent' ? '#a73b21' : '#303429' }]}>
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

        {/* Timing Section */}
        <Text style={styles.sectionTitle}>Timing</Text>
        <View style={[styles.timingBox, { borderLeftColor: getTimingDisplay().color }]}>
          <Text style={styles.timingIcon}>{getTimingDisplay().icon}</Text>
          <Text style={[styles.timingText, { color: getTimingDisplay().color }]}>
            {getTimingDisplay().text}
          </Text>
        </View>

        {/* Requester Info */}
        <Text style={styles.sectionTitle}>Requester</Text>
        <View style={styles.requesterBox}>
          <View style={styles.requesterAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.requesterInfo}>
            <Text style={styles.requesterName}>Community Member</Text>
            <Text style={styles.requesterMeta}>ID: {request.requester_id.substring(0, 8)}...</Text>
          </View>
        </View>

        {/* Help or Delete Button */}
        {request.requester_id === user?.id ? (
          <TouchableOpacity 
            style={[styles.helpButton, styles.deleteButton]}
            onPress={handleDeleteRequest}
            disabled={isDeleting}
          >
            <Text style={styles.helpButtonText}>
              {isDeleting ? 'Deleting...' : '🗑️ Delete Request'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Offer Help</Text>
          </TouchableOpacity>
        )}
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
  timingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    gap: 12,
    marginBottom: 20,
  },
  timingIcon: {
    fontSize: 20,
  },
  timingText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  requesterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  requesterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e4d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  requesterInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 4,
  },
  requesterMeta: {
    fontSize: 12,
    color: '#797c6f',
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
  deleteButton: {
    backgroundColor: '#a73b21',
  },
  errorText: {
    fontSize: 16,
    color: '#a73b21',
    textAlign: 'center',
    marginTop: 20,
  },
});
