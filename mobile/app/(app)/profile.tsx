import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useState, useCallback } from 'react';
import api from '../../services/api';

interface Review {
  id: string;
  reviewer: {
    first_name: string;
    last_name: string;
    id: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.first_name || '');
  const [editLastName, setEditLastName] = useState(user?.last_name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [freshUser, setFreshUser] = useState(user);

  const fetchUserData = async () => {
    if (!user?.id) return;
    try {
      const userData = await api.getUser(user.id);
      setFreshUser(userData);
      useAuthStore.setState({ user: userData });
      
      // Update edit form with fresh data
      setEditFirstName(userData.first_name);
      setEditLastName(userData.last_name);
      setEditBio(userData.bio || '');
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!user?.id) return;
    try {
      const userReviews = await api.getUserReviews(user.id);
      setReviews(userReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  // Fetch data when screen comes into focus (every time user visits this tab)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchUserData();
        fetchReviews();
      }
    }, [user?.id])
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const openEditModal = () => {
    setEditError(null);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditError(null);
    // Reset to current user data
    if (user) {
      setEditFirstName(user.first_name);
      setEditLastName(user.last_name);
      setEditBio(user.bio || '');
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    // Validate inputs
    if (!editFirstName.trim() || !editLastName.trim()) {
      setEditError('First name and last name are required');
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const updateData = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        bio: editBio.trim() || null,
      };

      const updatedUser = await api.updateUser(user.id, updateData);
      
      // Update local store with new user data
      useAuthStore.setState({ user: updatedUser });
      
      // Close modal and refresh profile data
      setEditModalVisible(false);
      
      // Refresh both user data and reviews
      await fetchUserData();
      await fetchReviews();
    } catch (error: any) {
      setEditError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Get initials for avatar
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  // Get user activity year
  const activityYear = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Use fresh user data if available, otherwise fall back to cached user
  const displayUser = freshUser || user;

  // Mock impact stats - these are from the user object now
  const impactStats = [
    { icon: '🚗', value: displayUser?.total_favors_given || 0, label: 'Rides given' },
    { icon: '✓', value: displayUser?.total_favors_given || 0, label: 'Meals delivered' },
    { icon: '🔧', value: displayUser?.total_favors_given || 0, label: 'Neighbors helped moving' },
  ];

  // Extract categories from user role
  const getClusters = () => {
    const clusters = [];
    if (displayUser?.role === 'both' || displayUser?.role === 'driver') {
      clusters.push({ icon: '🚗', label: 'Mobility' });
    }
    if (displayUser?.role === 'both' || displayUser?.role === 'rider') {
      clusters.push({ icon: '💪', label: 'Muscle' });
      clusters.push({ icon: '🍽️', label: 'Food' });
    }
    return clusters.length > 0 ? clusters : [
      { icon: '🚗', label: 'Mobility' },
      { icon: '💪', label: 'Muscle' },
      { icon: '🍽️', label: 'Food' },
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Edit Button - Top Right */}
        <TouchableOpacity style={styles.editIconButton} onPress={openEditModal}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>

        {/* Profile Avatar with Badge */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.badgeText}>✓</Text>
            </View>
          </View>

          {/* Name and Bio */}
          <Text style={styles.fullName}>
            {displayUser?.first_name} {displayUser?.last_name}
          </Text>
          <Text style={styles.roleTitle}>{displayUser?.bio || 'No bio yet'}</Text>
          <View style={styles.activeSinceBadge}>
            <Text style={styles.activeSinceText}>ACTIVE SINCE {activityYear}</Text>
          </View>
        </View>

        {/* Your Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.impactGrid}>
            {impactStats.map((stat, idx) => (
              <View
                key={idx}
                style={[
                  styles.impactCard,
                  idx === 0 && { backgroundColor: '#b3e5fc' },
                  idx === 1 && { backgroundColor: '#c8e6c9' },
                  idx === 2 && { backgroundColor: '#ffe0b2' },
                  idx === 2 && styles.impactCardFull,
                ]}
              >
                <Text style={styles.impactIcon}>{stat.icon}</Text>
                <Text style={styles.impactValue}>{stat.value}</Text>
                <Text style={styles.impactLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total Contributions */}
        <View style={styles.contributionsSection}>
          <View style={styles.contributionsContent}>
            <View>
              <Text style={styles.contributionsLabel}>TOTAL CONTRIBUTIONS</Text>
              <Text style={styles.contributionsValue}>
                {(displayUser?.total_favors_given || 0) + (displayUser?.total_favors_received || 0)} Favors
              </Text>
            </View>
            <Text style={styles.leafIcon}>🍃</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clusters you help with</Text>
          <View style={styles.categoriesContainer}>
            {getClusters().map((cluster, idx) => (
              <View key={idx} style={styles.categoryTag}>
                <Text style={styles.categoryIcon}>{cluster.icon}</Text>
                <Text style={styles.categoryText}>{cluster.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes of Thanks</Text>
          {reviews.length > 0 ? (
            <>
              {reviews.map((review) => (
                <View key={review.id} style={styles.testimonialCard}>
                  <View style={styles.testimonialHeader}>
                    <View style={styles.testimonialAvatar}>
                      <Text style={styles.testimonialAvatarText}>
                        {review.reviewer.first_name[0]}
                      </Text>
                    </View>
                    <View style={styles.testimonialInfo}>
                      <Text style={styles.testimonialName}>
                        {review.reviewer.first_name} {review.reviewer.last_name}
                      </Text>
                      <Text style={styles.testimonialDate}>{formatDate(review.created_at)}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{'⭐'.repeat(review.rating)}</Text>
                    </View>
                  </View>
                  <Text style={styles.testimonialText}>"{review.comment}"</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No reviews yet</Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>{displayUser?.phone_number}</Text>
          </View>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{displayUser?.email}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeEditModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* First Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholderTextColor="#b0a89e"
                />
              </View>

              {/* Last Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholderTextColor="#b0a89e"
                />
              </View>

              {/* Bio */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Tell us about yourself"
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline={true}
                  numberOfLines={4}
                  placeholderTextColor="#b0a89e"
                  textAlignVertical="top"
                />
              </View>

              {/* Error Message */}
              {editError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{editError}</Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  editIconButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0e8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  editIcon: {
    fontSize: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5d8',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6b8e6f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#d4a574',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#b3d9a3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fafaf0',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  fullName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 14,
    color: '#797c6f',
    marginBottom: 12,
  },
  activeSinceBadge: {
    backgroundColor: '#e5e5d8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeSinceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#303429',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 16,
  },
  impactGrid: {
    gap: 12,
  },
  impactCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  impactCardFull: {
    width: '100%',
  },
  impactIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 2,
  },
  impactLabel: {
    fontSize: 13,
    color: '#303429',
    fontWeight: '500',
  },
  contributionsSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  contributionsContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3c6a35',
  },
  contributionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#797c6f',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contributionsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#303429',
  },
  leafIcon: {
    fontSize: 32,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f0e8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303429',
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#b3d9a3',
  },
  testimonialHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4a574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  testimonialInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  testimonialName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#303429',
  },
  testimonialDate: {
    fontSize: 11,
    color: '#797c6f',
    marginTop: 2,
  },
  ratingBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
  },
  testimonialText: {
    fontSize: 13,
    color: '#303429',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#797c6f',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3c6a35',
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#797c6f',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#303429',
  },
  logoutButton: {
    marginHorizontal: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#a73b21',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editIcon: {
    fontSize: 20,
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#3c6a35',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5d8',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#303429',
    fontWeight: '600',
    width: 24,
    height: 24,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#303429',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
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
  bioInput: {
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 100,
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
  saveButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#3c6a35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f0f0e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#303429',
  },
});
