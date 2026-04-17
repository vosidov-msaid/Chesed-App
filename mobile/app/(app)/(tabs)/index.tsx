import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';

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
}

const ITEMS_PER_PAGE = 10;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch requests
  const fetchRequests = useCallback(
    async (offset: number = 0) => {
      try {
        if (offset === 0) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const data = await api.getRequests(offset, ITEMS_PER_PAGE);

        if (offset === 0) {
          setRequests(data);
        } else {
          setRequests((prev) => [...prev, ...data]);
        }

        // If we got fewer items than requested, we've reached the end
        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setSkip(offset + ITEMS_PER_PAGE);
      } catch (error: any) {
        const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to fetch requests';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchRequests(0);
  }, [fetchRequests]);

  // Handle infinite scroll
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchRequests(skip);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setSkip(0);
    fetchRequests(0);
  };

  // Render request card
  const renderRequestCard = ({ item }: { item: Request }) => {
    const urgencyColor =
      item.urgency === 'high'
        ? '#a73b21'
        : item.urgency === 'medium'
          ? '#f59e0b'
          : '#10b981';

    const statusColor =
      item.status === 'open'
        ? '#10b981'
        : item.status === 'in_progress'
          ? '#3b82f6'
          : '#6b7280';

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View
            style={[
              styles.urgencyTag,
              { backgroundColor: urgencyColor + '20' },
            ]}
          >
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>
              {item.urgency}
            </Text>
          </View>
        </View>

        <Text style={styles.locationText}>📍 {item.location_name}</Text>
      </TouchableOpacity>
    );
  };

  // Render footer (loading indicator for infinite scroll)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </View>
    );
  };

  // Render empty state
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchRequests(0)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} requests available
        </Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fafaf0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#303429',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#797c6f',
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3c6a35',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  cardDescription: {
    fontSize: 14,
    color: '#5a5e54',
    marginBottom: 10,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#e6f4fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    textTransform: 'capitalize',
  },
  urgencyTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  locationText: {
    fontSize: 13,
    color: '#797c6f',
    fontWeight: '500',
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a73b21',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#5a5e54',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3c6a35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
