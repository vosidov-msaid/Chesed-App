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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useGeolocation } from '../../../utils/useGeolocation';
import { useWebSocket } from '../../../utils/useWebSocket';
import { calculateDistance } from '../../../utils/distance';

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
  latitude: number;
  longitude: number;
  scheduled_at?: string;
  distance?: number; // Cached distance in miles
}



const ITEMS_PER_PAGE = 30;

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
  const { isConnected, messages: wsMessages } = useWebSocket();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [maxDistance, setMaxDistance] = useState<string>('');
  const [appliedDistance, setAppliedDistance] = useState<number | null>(null);
  const [messagesModalVisible, setMessagesModalVisible] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchRequests = useCallback(
    async (offset: number = 0) => {
      try {
        if (offset === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const data = await api.getRequests(offset, ITEMS_PER_PAGE);
        console.log('🔍 API returned:', data.length, 'requests');
        console.log('Current user ID:', user?.id);
        if (data.length > 0) {
          console.log('First request:', { 
            id: data[0].id, 
            requester_id: data[0].requester_id, 
            status: data[0].status 
          });
        }
        
        const filteredData = data
          .filter(req => req.requester_id !== user?.id)
          .map(req => ({
            ...req,
            distance: location && req.latitude && req.longitude 
              ? calculateDistance(location.latitude, location.longitude, req.latitude, req.longitude)
              : undefined
          }));
        console.log('📊 Filtered to:', filteredData.length, 'requests');

        if (offset === 0) {
          setRequests(filteredData);
        } else {
          setRequests((prev) => [...prev, ...filteredData]);
        }

        if (filteredData.length < ITEMS_PER_PAGE) {
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
    [user?.id, location]
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

  const handleOpenFilter = () => {
    setFilterModalVisible(true);
  };

  const handleApplyFilter = () => {
    if (maxDistance.trim()) {
      const distance = parseFloat(maxDistance);
      if (!isNaN(distance) && distance > 0) {
        setAppliedDistance(distance);
        setFilterModalVisible(false);
      }
    }
  };

  const handleClearFilter = () => {
    setMaxDistance('');
    setAppliedDistance(null);
    setFilterModalVisible(false);
  };

  const handleOpenMessages = async () => {
    setMessagesLoading(true);
    setMessagesModalVisible(true);
    try {
      // Fetch all commitments
      const allCommitments = await api.getCommitments(0, 100);
      
      // Get all requests to build request map
      const userRequestData = await api.getRequests(0, 100);
      const requestMap = new Map<string, any>();
      const userRequestIds = new Set<string>();
      
      userRequestData.forEach((req: any) => {
        requestMap.set(req.id, req);
        if (req.requester_id === user?.id) {
          userRequestIds.add(req.id);
        }
      });

      // Filter commitments where:
      // 1. User is the requester (posted the request), OR
      // 2. User is the helper (offering help)
      const relevantMessages = await Promise.all(
        allCommitments
          .filter((commitment: any) => {
            const isRequester = userRequestIds.has(commitment.request_id);
            const isHelper = commitment.helper_id === user?.id;
            return isRequester || isHelper;
          })
          .map(async (commitment: any) => {
            try {
              const request = requestMap.get(commitment.request_id);
              const isUserRequester = request?.requester_id === user?.id;
              
              // Get the other party's info (helper if user is requester, requester if user is helper)
              let otherUserId: string;
              if (isUserRequester) {
                otherUserId = commitment.helper_id; // Show helper info
              } else {
                otherUserId = request?.requester_id; // Show requester info
              }
              
              const otherUser = await api.getUser(otherUserId);
              
              return {
                id: commitment.id,
                otherUserId,
                otherUserName: `${otherUser.first_name} ${otherUser.last_name}`,
                otherUserBio: otherUser.bio || `ID: ${otherUser.id.substring(0, 8)}...`,
                requestId: commitment.request_id,
                requestTitle: request?.title || 'Request',
                notes: commitment.notes || 'No message',
                status: commitment.status,
                createdAt: commitment.created_at,
                otherUser,
              };
            } catch (err) {
              const request = requestMap.get(commitment.request_id);
              const isUserRequester = request?.requester_id === user?.id;
              const otherUserId = isUserRequester ? commitment.helper_id : request?.requester_id;
              
              return {
                id: commitment.id,
                otherUserId,
                otherUserName: `User ${otherUserId.substring(0, 8)}...`,
                otherUserBio: 'ID: ' + otherUserId.substring(0, 8),
                requestId: commitment.request_id,
                requestTitle: request?.title || 'Request',
                notes: commitment.notes || 'No message',
                status: commitment.status,
                createdAt: commitment.created_at,
                otherUser: null,
              };
            }
          })
      );

      setMessages(relevantMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Handle real-time WebSocket messages
  useEffect(() => {
    wsMessages.forEach((msg) => {
      if (msg.type === 'message_created') {
        setMessages((prev) => [...prev, msg.data]);
        console.log('✅ New message received:', msg.data);
      } else if (msg.type === 'message_deleted') {
        setMessages((prev) =>
          prev.filter((m) => m.id !== msg.data.commitment_id)
        );
        console.log('❌ Message deleted:', msg.data.commitment_id);
      } else if (msg.type === 'message_updated') {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.data.id ? msg.data : m))
        );
        console.log('📝 Message updated:', msg.data);
      }
    });
  }, [wsMessages]);

  const getDisplayRequests = () => {
    if (!appliedDistance) return requests;
    return requests.filter(req => req.distance !== undefined && req.distance <= appliedDistance);
  };

  const getTimingDisplay = (request: Request) => {
    if (request.urgency === 'high' || request.urgency === 'urgent') {
      return { icon: '⚡', text: 'Now', color: '#a73b21' };
    }
    if (request.scheduled_at) {
      const date = new Date(request.scheduled_at);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { icon: '📅', text: `${dateStr} at ${timeStr}`, color: '#797c6f' };
    }
    return { icon: '📅', text: 'Scheduled', color: '#797c6f' };
  };

  const renderHeader = () => (
    <View>
      {/* Location Section with Messages Button */}
      <View style={styles.locationSection}>
        <View style={styles.locationHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>📍 Your Location</Text>
            {locationLoading ? (
              <ActivityIndicator size="small" color="#3c6a35" />
            ) : (
              <Text style={styles.locationText}>
                {location?.address || 'Getting location...'}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.messagesButton} onPress={handleOpenMessages}>
            <Text style={styles.messagesButtonIcon}>💬</Text>
            {/* <Text style={styles.messagesButtonText}>Messages</Text> */}
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity onPress={handleOpenFilter}>
          <Text style={styles.filterButton}>{appliedDistance ? `Filter (${appliedDistance}mi)` : 'Filter'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestCard = ({ item }: { item: Request }) => {
    const categoryColor = CATEGORY_COLORS[item.category] || '#3c6a35';
    const categoryIcon = CATEGORY_ICONS[item.category] || '📌';
    const timing = getTimingDisplay(item);
    
    let distanceText = 'Near you';
    if (item.distance !== undefined) {
      distanceText = `${item.distance} mi away`;
    }

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: categoryColor }]}
       onPress={() => router.push({
         pathname: `/(app)/(tabs)/request/${item.id}`,
         params: { distance: item.distance }
       })}
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
          <Text style={styles.distance}>{distanceText}</Text>
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
          onPress={() => router.push({
            pathname: `/(app)/(tabs)/request/${item.id}`,
            params: { distance: item.distance }
          })}
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
        data={getDisplayRequests()}
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

      {/* Messages Modal */}
      <Modal
        visible={messagesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMessagesModalVisible(false)}
      >
        <SafeAreaView style={styles.messagesModalContainer}>
          <View style={styles.messagesModalHeader}>
            <Text style={styles.messagesModalTitle}>Messages</Text>
            <TouchableOpacity onPress={() => setMessagesModalVisible(false)}>
              <Text style={styles.messagesModalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {messagesLoading ? (
            <View style={styles.messagesLoadingContainer}>
              <ActivityIndicator size="large" color="#3c6a35" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.messagesEmptyContainer}>
              <Text style={styles.messagesEmptyText}>No messages yet</Text>
              <Text style={styles.messagesEmptySubText}>
                When helpers reach out about your requests, they'll appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.messageItem}
                  onPress={() => {
                    router.push({
                      pathname: '/chat',
                      params: {
                        commitmentId: item.id,
                        requestId: item.requestId,
                        requesterId: item.otherUserId,
                        requesterName: item.otherUserName,
                        requestTitle: item.requestTitle,
                        isFromMessages: 'true',
                      },
                    });
                    setMessagesModalVisible(false);
                  }}
                >
                  {/* User Profile Section */}
                  <TouchableOpacity
                    style={styles.messageProfileRow}
                    onPress={() => {
                      console.log('Navigating to profile with userId:', item.otherUserId);
                      setMessagesModalVisible(false);
                      router.push({
                        pathname: '/(app)/user-profile',
                        params: {
                          userId: item.otherUserId,
                        },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.messageBadge}>
                      <Text style={styles.messageBadgeEmoji}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.messageHelperName}>{item.otherUserName}</Text>
                      <Text style={styles.messageHelperBio}>{item.otherUserBio}</Text>
                    </View>
                    <Text style={styles.profileLink}>→</Text>
                  </TouchableOpacity>

                  {/* Request Info - Clickable */}
                  <TouchableOpacity
                   style={styles.messageRequestInfo}
                   onPress={() => {
                     router.push(`/(app)/(tabs)/request/${item.requestId}`);
                     setMessagesModalVisible(false);
                   }}
                  >
                   <Text style={styles.messageRequestLabel}>Request:</Text>
                   <Text style={styles.messageRequestTitle} numberOfLines={1}>
                     {item.requestTitle}
                   </Text>
                   <Text style={styles.requestDetailsLink}>View Details →</Text>
                  </TouchableOpacity>

                  {/* Message Content */}
                  <View style={styles.messageContentWrapper}>
                    <Text style={styles.messageContent}>{item.notes}</Text>
                    <View style={styles.messageFooter}>
                      <Text style={styles.messageStatus}>{item.status}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Chat Button */}
                  <View style={styles.messageChatButton}>
                    <Text style={styles.messageChatButtonText}>💬 View Chat</Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.messagesListContent}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter by Distance</Text>
              <Text style={styles.modalSubtitle}>Show requests within this distance (miles)</Text>
              
              <TextInput
                style={styles.distanceInput}
                placeholder="Enter distance (e.g., 5)"
                placeholderTextColor="#bdbdb0"
                keyboardType="decimal-pad"
                value={maxDistance}
                onChangeText={setMaxDistance}
                autoFocus
              />

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={handleClearFilter}
                >
                  <Text style={styles.modalCancelButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalApplyButton}
                  onPress={handleApplyFilter}
                >
                  <Text style={styles.modalApplyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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

  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fafaf0',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#303429',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#797c6f',
  },
  distanceInput: {
    borderWidth: 1,
    borderColor: '#e2e4d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#303429',
    backgroundColor: '#ffffff',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303429',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: '#3c6a35',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Location Section Header
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  messagesButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e4d4',
  },
  messagesButtonIcon: {
    fontSize: 16,
  },
  messagesButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#303429',
  },

  // Messages Modal Styles
  messagesModalContainer: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  messagesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e4d4',
  },
  messagesModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#303429',
  },
  messagesModalCloseButton: {
    fontSize: 24,
    color: '#797c6f',
    fontWeight: '600',
  },
  messagesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  messagesEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#303429',
    marginBottom: 8,
  },
  messagesEmptySubText: {
    fontSize: 14,
    color: '#797c6f',
    textAlign: 'center',
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3c6a35',
  },
  messageProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4ed',
  },
  messageBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBadgeEmoji: {
    fontSize: 20,
  },
  messageHelperName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#303429',
  },
  messageHelperBio: {
    fontSize: 12,
    color: '#797c6f',
    marginTop: 2,
  },
  profileLink: {
    fontSize: 16,
    color: '#3c6a35',
    fontWeight: '600',
  },
  messageRequestInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4ed',
  },
  messageRequestLabel: {
    fontSize: 11,
    color: '#797c6f',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  messageRequestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#303429',
    marginBottom: 6,
  },
  requestDetailsLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c6a35',
  },
  messageContentWrapper: {
    marginBottom: 12,
  },
  messageContent: {
    fontSize: 14,
    color: '#303429',
    lineHeight: 20,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageStatus: {
    fontSize: 11,
    color: '#3c6a35',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  messageTime: {
    fontSize: 11,
    color: '#797c6f',
  },
  messageChatButton: {
    backgroundColor: '#f0f4ed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3c6a35',
  },
  messageChatButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c6a35',
  },
});
