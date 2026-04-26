import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  DatePickerAndroid,
  TimePickerAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
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

const CATEGORIES = [
  { label: 'Mobility', value: 'mobility', icon: '🚗' },
  { label: 'Errands', value: 'errands', icon: '🛍️' },
  { label: 'Food', value: 'food', icon: '🍽️' },
  { label: 'Borrow/Lend', value: 'borrow_lend', icon: '🔄' },
  { label: 'Care', value: 'care', icon: '❤️' },
  { label: 'Muscle', value: 'muscle', icon: '💪' },
  { label: 'Presence', value: 'presence', icon: '👥' },
  { label: 'Skills', value: 'practical_skills', icon: '🔧' },
];

const URGENCY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [step, setStep] = useState(1);
  const [locationLoading, setLocationLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [timing, setTiming] = useState('now');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const openCreateModal = async () => {
    setShowCreateModal(true);
    setStep(1);
    setModalError(null);
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setModalError('Location permission denied. Please enable in settings.');
        setLocationLoading(false);
        return;
      }
      await fetchCurrentLocation();
    } catch (err) {
      setModalError('Failed to get location.');
      setLocationLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = currentLocation.coords;
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const addressName = addresses.length > 0
        ? `${addresses[0].city || addresses[0].region}, ${addresses[0].country}`
        : 'Current Location';
      setLocation({ latitude, longitude, name: addressName });
      setModalError(null);
    } catch (err) {
      setModalError('Unable to get location.');
    } finally {
      setLocationLoading(false);
    }
  };



  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setScheduledDate(date);
    }
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (date) {
      setScheduledDate(date);
    }
    setShowTimePicker(false);
  };

  const formatScheduledDateTime = () => {
    const date = scheduledDate.toLocaleDateString();
    const time = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} at ${time}`;
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setStep(1);
    setCategory('');
    setTitle('');
    setDescription('');
    setUrgency('normal');
    setTiming('now');
    setNotes('');
    setModalError(null);
  };

  const handleCreateNext = () => {
    if (step === 1 && !category) {
      setModalError('Please select a category');
      return;
    }
    if (step === 2) {
      if (!title.trim() || title.length < 5) {
        setModalError('Title must be at least 5 characters');
        return;
      }
      if (!description.trim() || description.length < 10) {
        setModalError('Description must be at least 10 characters');
        return;
      }
    }
    setModalError(null);
    setStep(step + 1);
  };

  const handleCreateSubmit = async () => {
    if (!location) {
      setModalError('Location is required to post a request');
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      const requestData = {
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.name,
        timing,
        urgency,
        notes: notes.trim() || null,
        scheduled_at: timing === 'scheduled' ? scheduledDate.toISOString() : null,
      };
      await api.createRequest(requestData);
      Alert.alert('Success', 'Request posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            closeCreateModal();
            fetchRequests(0);
          },
        },
      ]);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setModalLoading(false);
    }
  };

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

      {/* Create Request Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={closeCreateModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeCreateModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Post a Request</Text>
              <Text style={styles.stepIndicator}>Step {step} of 3</Text>
            </View>

            {/* Location Info */}
            {location && !locationLoading && (
              <View style={styles.locationCard}>
                <Text style={styles.locationLabel}>📍 Your Location</Text>
                <Text style={styles.locationName}>{location.name}</Text>
                <TouchableOpacity onPress={fetchCurrentLocation} style={styles.refreshButton}>
                  <Text style={styles.refreshText}>Refresh Location</Text>
                </TouchableOpacity>
              </View>
            )}

            {locationLoading && (
              <View style={styles.locationCard}>
                <ActivityIndicator size="small" color="#3c6a35" />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            )}

            {/* Error Message */}
            {modalError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{modalError}</Text>
              </View>
            )}

            {/* Step 1: Category */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>What do you need help with?</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryCard,
                        category === cat.value && styles.categoryCardSelected,
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 2: Title & Description */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Describe your request</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Brief title (e.g., Need ride to airport)"
                    value={title}
                    onChangeText={setTitle}
                    maxLength={255}
                  />
                  <Text style={styles.charCount}>{title.length}/255</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Detailed description of what you need"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{description.length} characters</Text>
                </View>
              </View>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Additional details</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Urgency Level</Text>
                  <View style={styles.buttonGroup}>
                    {URGENCY_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level.value}
                        style={[
                          styles.optionButton,
                          urgency === level.value && styles.optionButtonSelected,
                        ]}
                        onPress={() => setUrgency(level.value)}
                      >
                        <Text
                          style={[
                            styles.optionButtonText,
                            urgency === level.value && styles.optionButtonTextSelected,
                          ]}
                        >
                          {level.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Timing</Text>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        timing === 'now' && styles.optionButtonSelected,
                      ]}
                      onPress={() => setTiming('now')}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          timing === 'now' && styles.optionButtonTextSelected,
                        ]}
                      >
                        ASAP
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        timing === 'scheduled' && styles.optionButtonSelected,
                      ]}
                      onPress={() => setTiming('scheduled')}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          timing === 'scheduled' && styles.optionButtonTextSelected,
                        ]}
                      >
                        Later
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {timing === 'scheduled' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Schedule Date & Time</Text>
                    <View style={styles.dateTimeContainer}>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text style={styles.dateTimeButtonText}>
                          📅 {scheduledDate.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateTimeButton}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Text style={styles.dateTimeButtonText}>
                          🕐 {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.scheduledText}>
                      Scheduled for: {formatScheduledDateTime()}
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Additional Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any other information..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setStep(step - 1)}
                  disabled={modalLoading}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, modalLoading && styles.buttonDisabled]}
                onPress={step === 3 ? handleCreateSubmit : handleCreateNext}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {step === 3 ? 'Post Request' : 'Next'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </Modal>
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3c6a35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 36,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
  },
  closeButton: {
    fontSize: 24,
    color: '#303429',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#303429',
  },
  stepIndicator: {
    fontSize: 12,
    color: '#797c6f',
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3c6a35',
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#797c6f',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 12,
  },
  refreshButton: {
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c6a35',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#303429',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '500',
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#e5e5d8',
  },
  categoryCardSelected: {
    borderColor: '#3c6a35',
    backgroundColor: '#f0f5ed',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#303429',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#797c6f',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#303429',
    borderWidth: 1,
    borderColor: '#e5e5d8',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#797c6f',
    marginTop: 6,
    textAlign: 'right',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5d8',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#303429',
  },
  scheduledText: {
    fontSize: 13,
    color: '#3c6a35',
    fontWeight: '600',
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5d8',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#3c6a35',
    borderColor: '#3c6a35',
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303429',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#3c6a35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f0f0e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303429',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
