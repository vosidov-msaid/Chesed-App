import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useGeolocation } from '../../../utils/useGeolocation';

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  location_name: string;
  status: string;
  urgency: string;
  created_at: string;
  requester_id: string;
  distance?: number;
  scheduled_date?: string;
}



const ITEMS_PER_PAGE = 10;

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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { location, isLoading: locationLoading, requestLocation } = useGeolocation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(
    async (offset: number = 0) => {
      try {
        if (offset === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const data = await api.getRequests(offset, ITEMS_PER_PAGE);

        if (offset === 0) {
          setRequests(data);
        } else {
          setRequests((prev) => [...prev, ...data]);
        }

        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setSkip(offset + ITEMS_PER_PAGE);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRequests(0);
    requestLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setRequests([]);
      setSkip(0);
      setHasMore(true);
      fetchRequests(0);
    }, [fetchRequests])
  );

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchRequests(skip);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setSkip(0);
    fetchRequests(0);
  };

  const handleStartRequest = () => {
    router.push('/post');
  };

  const getTimingDisplay = (request: Request) => {
    if (request.urgency === 'high' || request.urgency === 'urgent') {
      return { icon: '⚡', text: 'Now', color: '#a73b21' };
    }
    if (request.scheduled_date) {
      const date = new Date(request.scheduled_date);
      return { icon: '📅', text: date.toLocaleDateString(), color: '#797c6f' };
    }
    return { icon: '📅', text: 'Scheduled', color: '#797c6f' };
  };

  const renderHeader = () => (
    <View>
      {/* Location Section */}
      <View style={styles.locationSection}>
        <Text style={styles.locationLabel}>📍 Your Location</Text>
        {locationLoading ? (
          <ActivityIndicator size="small" color="#3c6a35" />
        ) : (
          <Text style={styles.locationText}>
            {location?.address || 'Getting location...'}
          </Text>
        )}
      </View>

      {/* Hero Section - Only show if no requests */}
      {requests.length === 0 && (
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Need a Favor?</Text>
          <Text style={styles.heroSubtitle}>
            Your community is here to help. Share what you need, and let kindness find its way to you.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={handleStartRequest}
          >
            <Text style={styles.heroButtonText}>Start a New Request</Text>
            <Text style={styles.heroButtonIcon}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Header */}
      <View style={[styles.sectionHeader, requests.length > 0 && styles.sectionHeaderWithoutHero]}>
        <View>
          <Text style={styles.sectionTitle}>Nearby Help Requests</Text>
          <Text style={styles.sectionSubtitle}>ACTIVE IN YOUR CIRCLE</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.filterButton}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestCard = ({ item }: { item: Request }) => {
    const categoryColor = CATEGORY_COLORS[item.category] || '#3c6a35';
    const categoryIcon = CATEGORY_ICONS[item.category] || '📌';
    const timing = getTimingDisplay(item);
    const distance = item.distance ? `${item.distance} mi away` : 'Near you';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: categoryColor }]}
        onPress={() => router.push(`/(app)/(tabs)/request/${item.id}`)}
      >
        {/* Card Header: Category Badge + Distance */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColor + '20' },
            ]}
          >
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <Text
              style={[styles.categoryLabel, { color: categoryColor }]}
              numberOfLines={1}
            >
              {item.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.distance}>{distance}</Text>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Description */}
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Timing */}
        <View style={styles.timingSection}>
          <Text style={styles.timingIcon}>{timing.icon}</Text>
          <Text style={[styles.timingText, { color: timing.color, fontWeight: timing.color === '#a73b21' ? '700' : '600' }]}>
            {timing.text}
          </Text>
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => router.push(`/(app)/(tabs)/request/${item.id}`)}
        >
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };



  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No requests found</Text>
        <Text style={styles.emptySubText}>Pull down to refresh</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  flatListContent: {
    paddingBottom: 100,
  },

  // Location Section
  locationSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f0f4ed',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e4d4',
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#797c6f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3c6a35',
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#303429',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#797c6f',
    lineHeight: 24,
  },
  heroButton: {
    backgroundColor: '#3c6a35',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  heroButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sectionHeaderWithoutHero: {
    paddingTop: 44,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#797c6f',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3c6a35',
  },

  // Card Styles
  card: {
    backgroundColor: '#f4f4e9',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
    flex: 1,
  },
  distance: {
    fontSize: 12,
    color: '#797c6f',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#303429',
  },
  cardDescription: {
    fontSize: 14,
    color: '#5d6054',
    lineHeight: 20,
  },
  timingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timingIcon: {
    fontSize: 16,
  },
  timingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#303429',
  },



  // Loading & Empty States
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#303429',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#797c6f',
  },
});
