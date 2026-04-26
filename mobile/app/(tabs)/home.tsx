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
import { useRouter } from 'expo-router';
import api from '../../services/api';

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  cluster: string;
  location_name: string;
  distance?: number;
  urgency: string;
  scheduled_date?: string;
  status: string;
}

interface CommunityWin {
  id: string;
  userName: string;
  helperName: string;
  action: string;
  time: string;
  testimonial: string;
}

const ITEMS_PER_PAGE = 10;

// Map clusters to colors
const CLUSTER_COLORS: { [key: string]: string } = {
  mobility: '#4b6368',
  errands: '#3c6a35',
  food: '#865406',
  borrow: '#5d3800',
  care: '#376430',
  muscle: '#694000',
  presence: '#475f64',
  skills: '#5a3f35',
};

const CLUSTER_ICONS: { [key: string]: string } = {
  mobility: '🚗',
  errands: '📦',
  food: '🍲',
  borrow: '🛠️',
  care: '👶',
  muscle: '💪',
  presence: '🫂',
  skills: '🔧',
};

export default function HomeScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch requests
  const fetchRequests = useCallback(
    async (offset: number = 0, isRefresh: boolean = false) => {
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
  }, [fetchRequests]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchRequests(skip);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setSkip(0);
    fetchRequests(0, true);
  };

  const handleStartRequest = () => {
    router.push('/post');
  };

  // Render hero section
  const renderHero = () => (
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
        <Text style={styles.heroButtonIcon}>➕</Text>
      </TouchableOpacity>
    </View>
  );

  // Render section header
  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>Nearby Help Requests</Text>
        <Text style={styles.sectionSubtitle}>Active in your circle</Text>
      </View>
      <TouchableOpacity>
        <Text style={styles.filterButton}>Filter</Text>
      </TouchableOpacity>
    </View>
  );

  // Render request card
  const renderRequestCard = ({ item }: { item: Request }) => {
    const clusterColor = CLUSTER_COLORS[item.cluster] || '#3c6a35';
    const clusterIcon = CLUSTER_ICONS[item.cluster] || '📌';
    const distance = item.distance ? `${item.distance} mi away` : 'Near you';
    const isUrgent = item.urgency === 'high' || item.urgency === 'now';
    const timing = isUrgent ? 'Now' : item.scheduled_date || 'Scheduled';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: clusterColor }]}
        onPress={() => router.push(`/request/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.clusterBadge,
              { backgroundColor: clusterColor + '20' },
            ]}
          >
            <Text style={styles.clusterIcon}>{clusterIcon}</Text>
            <Text
              style={[styles.clusterLabel, { color: clusterColor }]}
              numberOfLines={1}
            >
              {item.cluster}
            </Text>
          </View>
          <Text style={styles.distance}>{distance}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.timingBadge}>
            <Text style={styles.timingIcon}>
              {isUrgent ? '⚡' : '📅'}
            </Text>
            <Text
              style={[
                styles.timingText,
                isUrgent && { color: '#a73b21', fontWeight: '700' },
              ]}
            >
              {timing}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render community wins
  const renderCommunityWins = () => (
    <View style={styles.communityWinsSection}>
      <Text style={styles.communityWinsTitle}>Recent Community Wins</Text>
      <View style={styles.stackedCard}>
        <View style={[styles.stackLayer, styles.stackLayer1]}>
          <View style={styles.winContent}>
            <Text style={styles.winAction}>✨ Rivka's garden was tidied</Text>
            <Text style={styles.winHelper}>Helped by David • 2h ago</Text>
            <Text style={styles.winTestimonial}>
              "A small gesture that brought so much light to my week. Thank you!"
            </Text>
          </View>
        </View>
        <View style={[styles.stackLayer, styles.stackLayer2]} />
        <View style={[styles.stackLayer, styles.stackLayer3]} />
      </View>
    </View>
  );

  // Render footer (loading indicator)
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            {renderHero()}
            {renderSectionHeader()}
          </>
        }
        ListFooterComponent={
          <>
            {renderFooter()}
            {requests.length > 0 && renderCommunityWins()}
          </>
        }
        ListEmptyComponent={renderEmpty}
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  flatListContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
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
    fontSize: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  card: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clusterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  clusterIcon: {
    fontSize: 14,
  },
  clusterLabel: {
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
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#5d6054',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timingIcon: {
    fontSize: 14,
  },
  timingText: {
    fontSize: 13,
    color: '#797c6f',
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
  communityWinsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  communityWinsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 16,
  },
  stackedCard: {
    height: 180,
    position: 'relative',
  },
  stackLayer: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e4d4',
  },
  stackLayer1: {
    height: 180,
    zIndex: 3,
    padding: 16,
  },
  stackLayer2: {
    height: 60,
    top: -8,
    zIndex: 2,
    opacity: 0.6,
  },
  stackLayer3: {
    height: 60,
    top: -16,
    zIndex: 1,
    opacity: 0.3,
  },
  winContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  winAction: {
    fontSize: 15,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 4,
  },
  winHelper: {
    fontSize: 13,
    color: '#797c6f',
    marginBottom: 12,
  },
  winTestimonial: {
    fontSize: 14,
    color: '#5d6054',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

