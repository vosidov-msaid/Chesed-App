import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import api from '../../services/api';

export default function PostScreen() {
  const router = useRouter();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [timing, setTiming] = useState<'now' | 'scheduled'>('now');
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<'date' | 'time'>('date');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clusters = [
    { id: 'mobility', name: '🚗 Mobility', label: 'RIDES & LIFTS', color: '#4b6368' },
    { id: 'errands', name: '📦 Errands & Logistics', label: 'PICKUP & DROP', color: '#3c6a35' },
    { id: 'food', name: '🍲 Food', label: 'DELIVERY & SUPPORT', color: '#865406' },
    { id: 'borrow_lend', name: '🛠️ Borrow / Lend', label: 'TOOLS & ITEMS', color: '#5d3800' },
    { id: 'care', name: '👶 Care', label: 'KIDS & ELDERLY', color: '#376430' },
    { id: 'muscle', name: '💪 Muscle', label: 'HEAVY LIFTING', color: '#694000' },
    { id: 'presence', name: '🫂 Presence', label: 'VISITING & COMPANY', color: '#475f64' },
    { id: 'practical_skills', name: '🔧 Practical Skills', label: 'TECH & REPAIR', color: '#5a3f35' },
  ];

  const getClusterName = (id: string | null) => {
    return clusters.find(c => c.id === id)?.name || '';
  };

  useEffect(() => {
    if (step === 2 && !location) {
      requestLocation();
    }
  }, [step]);

  const requestLocation = async () => {
    setLocationLoading(true);
    setLocation(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;

        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          const address = reverseGeocode[0]
            ? `${reverseGeocode[0].city}, ${reverseGeocode[0].region}`
            : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          setLocation({ latitude, longitude, address });
        } catch (err) {
          setLocation({ latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to get location');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to request location permission');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedCluster) {
      Alert.alert('Please select a category first');
      return;
    }
    setStep(2);
  };

  const handleSubmitRequest = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (title.trim().length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }

    if (timing === 'scheduled' && !selectedDateTime) {
      Alert.alert('Error', 'Please select a date and time');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestDateTime = timing === 'now' ? new Date() : selectedDateTime;
      
      await api.createRequest({
        title,
        description,
        category: selectedCluster,
        urgency,
        timing,
        scheduled_at: requestDateTime?.toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.address,
      });

      Alert.alert('Success', 'Request posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setUrgency('normal');
            setTiming('now');
            setSelectedDateTime(null);
            setSelectedCluster(null);
            setLocation(null);
            router.push('/(app)/(tabs)');
          },
        },
      ]);
    } catch (err: any) {
      let errorMsg = 'Failed to post request';
      
      // Handle Pydantic validation errors (array of errors)
      if (Array.isArray(err?.response?.data?.detail)) {
        errorMsg = err.response.data.detail
          .map((e: any) => `${e.loc?.[1] || 'Field'}: ${e.msg}`)
          .join('\n');
      } 
      // Handle single error message
      else if (typeof err?.response?.data?.detail === 'string') {
        errorMsg = err.response.data.detail;
      }
      // Handle object errors
      else if (typeof err?.response?.data?.detail === 'object') {
        errorMsg = JSON.stringify(err.response.data.detail);
      }
      
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setUrgency('normal');
    setTiming('now');
    setSelectedDateTime(null);
    setShowDatePicker(false);
  };

  const handleDatePicker = () => {
    if (!selectedDateTime) {
      setSelectedDateTime(new Date());
    }
    setDateMode('date');
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date: Date | undefined) => {
    if (date) {
      if (dateMode === 'date') {
        setSelectedDateTime(date);
        // On Android, show time picker after date is selected
        if (Platform.OS === 'android') {
          setDateMode('time');
          setShowDatePicker(true);
        } else {
          // On iOS, automatically switch to time mode
          setDateMode('time');
        }
      } else {
        // Time has been selected
        setSelectedDateTime(date);
        setShowDatePicker(false);
        setDateMode('date');
      }
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Select date & time';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fafaf0' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Unified Header */}
        <View style={styles.unifiedHeader}>
          <View style={styles.headerCenter}>
            <Text style={styles.stepLabel}>STEP {step} OF 2</Text>
            <Text style={styles.headerTitle}>{step === 1 ? 'What do you need help with?' : 'Tell us more'}</Text>
          </View>
        </View>

        <View style={styles.headerSubtitle}>
          {step === 1 ? (
            <Text style={styles.subtitle}>
              Choose a category that best describes your request. This helps us find the most helpful neighbor in your circle.
            </Text>
          ) : (
            <Text style={styles.subtitle}>
              Help us understand your request so we can find the right person to help.
            </Text>
          )}
        </View>

        {step === 1 ? (
          <>
            {/* Step 1: Category Selection */}

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
                  <View
                    style={[
                      styles.clusterIconContainer,
                      { backgroundColor: cluster.color + '20' },
                    ]}
                  >
                    <Text style={styles.clusterEmoji}>{cluster.name.split(' ')[0]}</Text>
                  </View>
                  <Text
                    style={[
                      styles.clusterName,
                      selectedCluster === cluster.id && styles.clusterNameActive,
                    ]}
                  >
                    {cluster.name.split(' ').slice(1).join(' ')}
                  </Text>
                  <Text style={styles.clusterLabel}>{cluster.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Community First Section */}
            <View style={styles.communitySection}>
              <Text style={styles.communityTitle}>Community First</Text>
              <Text style={styles.communityText}>
                Chesed is built on the foundation of kindness. Whether you're moving house or just need a bowl of soup, our community is here to support you.
              </Text>
              <View style={styles.testimonialBox}>
                <Text style={styles.testimonialText}>
                  "A neighbor is a hand reaching across the fence."
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !selectedCluster && styles.submitButtonDisabled]}
              onPress={handleContinue}
              disabled={!selectedCluster}
            >
              <Text style={styles.submitButtonText}>Continue →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Step 2: Request Details */}

            {/* Selected Category Display */}
            <View style={styles.selectedCategoryBox}>
              <Text style={styles.selectedCategoryLabel}>Request Type</Text>
              <Text style={styles.selectedCategoryValue}>{getClusterName(selectedCluster)}</Text>
            </View>

            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title * (min 5 characters)</Text>
              <TextInput
                style={[styles.input, title.trim().length > 0 && title.trim().length < 5 && styles.inputError]}
                placeholder="Brief title of your request"
                placeholderTextColor="#b1b3a5"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!isLoading}
              />
              <Text style={[styles.charCount, title.trim().length > 0 && title.trim().length < 5 && styles.charCountError]}>
                {title.length}/100 {title.trim().length > 0 && title.trim().length < 5 ? '⚠️' : ''}
              </Text>
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description * (min 10 characters)</Text>
              <TextInput
                style={[styles.input, styles.textArea, description.trim().length > 0 && description.trim().length < 10 && styles.inputError]}
                placeholder="Provide details about what you need help with"
                placeholderTextColor="#b1b3a5"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={500}
                editable={!isLoading}
              />
              <Text style={[styles.charCount, description.trim().length > 0 && description.trim().length < 10 && styles.charCountError]}>
                {description.length}/500 {description.trim().length > 0 && description.trim().length < 10 ? '⚠️' : ''}
              </Text>
            </View>

            {/* Timing Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>When do you need it?</Text>
              <View style={styles.urgencyButtons}>
                <TouchableOpacity
                  style={[
                    styles.urgencyButton,
                    timing === 'now' && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setTiming('now')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      timing === 'now' && styles.urgencyButtonTextActive,
                    ]}
                  >
                    ⏱️ Now
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.urgencyButton,
                    timing === 'scheduled' && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setTiming('scheduled')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      timing === 'scheduled' && styles.urgencyButtonTextActive,
                    ]}
                  >
                    📆 Scheduled
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date & Time Picker */}
            {timing === 'scheduled' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Date & Time</Text>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleDatePicker}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    📅 {selectedDateTime ? formatDateTime(selectedDateTime) : 'Choose Date & Time'}
                  </Text>
                </TouchableOpacity>

                {/* Native Date Time Picker */}
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDateTime || new Date()}
                    mode={dateMode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
            )}

            {/* Urgency Level Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority Level</Text>
              <View style={[styles.urgencyButtons, styles.threeButtonRow]}>
                <TouchableOpacity
                  style={[
                    styles.urgencyButton,
                    urgency === 'low' && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setUrgency('low')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      urgency === 'low' && styles.urgencyButtonTextActive,
                    ]}
                  >
                    Low
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.urgencyButton,
                    urgency === 'normal' && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setUrgency('normal')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      urgency === 'normal' && styles.urgencyButtonTextActive,
                    ]}
                  >
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.urgencyButton,
                    urgency === 'high' && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setUrgency('high')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      urgency === 'high' && styles.urgencyButtonTextActive,
                    ]}
                  >
                    Urgent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>📍 Location</Text>
              {locationLoading ? (
                <View style={styles.locationBox}>
                  <ActivityIndicator color="#3c6a35" />
                  <Text style={styles.locationText}>Getting your location...</Text>
                </View>
              ) : location ? (
                <View style={styles.locationRow}>
                  <View style={styles.locationBox}>
                    <Text style={styles.locationText}>{location.address}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={requestLocation}
                    disabled={isLoading}
                  >
                    <Text style={styles.refreshButtonText}>🔄</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={requestLocation}
                  disabled={isLoading}
                >
                  <Text style={styles.locationButtonText}>📍 Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonLoading,
                (!location || !title.trim() || !description.trim() || (timing === 'scheduled' && !selectedDateTime)) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitRequest}
              disabled={isLoading || !location || !title.trim() || !description.trim() || (timing === 'scheduled' && !selectedDateTime)}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Post Request</Text>
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backActionButton}
              onPress={handleBack}
              disabled={isLoading}
            >
              <Text style={styles.backActionButtonText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },

  // Unified Header
  unifiedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303429',
  },
  headerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#303429',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3c6a35',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  // Step 1: Cluster Grid
  clusterGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  clusterCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e4d4',
    gap: 8,
  },
  clusterCardActive: {
    backgroundColor: '#b9eeab',
    borderColor: '#3c6a35',
    borderWidth: 2,
  },
  clusterIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterEmoji: {
    fontSize: 24,
  },
  clusterName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#303429',
    textAlign: 'center',
  },
  clusterNameActive: {
    color: '#1a4716',
  },
  clusterLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b1b3a5',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  // Community Section
  communitySection: {
    backgroundColor: '#f4f4e9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 12,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3c6a35',
  },
  communityText: {
    fontSize: 14,
    color: '#5d6054',
    lineHeight: 22,
  },
  testimonialBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3c6a35',
  },
  testimonialText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#797c6f',
  },

  // Step 2: Form
  selectedCategoryBox: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3c6a35',
  },
  selectedCategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#797c6f',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedCategoryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
  },

  // Form Groups
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#303429',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#303429',
  },
  textArea: {
    paddingTop: 12,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#b1b3a5',
    marginTop: 4,
    textAlign: 'right',
  },
  charCountError: {
    color: '#a73b21',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#a73b21',
  },

  // Urgency Buttons
  urgencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  threeButtonRow: {
    flexWrap: 'wrap',
  },
  urgencyButton: {
    flex: 1,
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e4d4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyButtonActive: {
    backgroundColor: '#b9eeab',
    borderColor: '#3c6a35',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#797c6f',
  },
  urgencyButtonTextActive: {
    color: '#1a4716',
  },

  // Date & Time Input
  dateTimeInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeInput: {
    flex: 1,
  },

  // Location Styles
  locationRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#303429',
  },
  locationCoords: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  refreshButton: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303429',
  },
  locationButton: {
    backgroundColor: '#3c6a35',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d5328',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Date Picker Button (kept for reference but no longer used)
  datePickerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e4d4',
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#303429',
  },

  // Date Picker Container
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e4d4',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e4d4',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303429',
  },
  datePickerHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#797c6f',
  },

  // Error Box
  errorBox: {
    backgroundColor: '#ffe6e0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a73b21',
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#a73b21',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#3c6a35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#b1b3a5',
    opacity: 0.6,
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Back Action Button
  backActionButton: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
  },
});
