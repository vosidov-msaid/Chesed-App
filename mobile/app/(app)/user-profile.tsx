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
import api from '../../services/api';

interface Review {
  id: string;
  reviewer: {
    first_name: string;
    last_name: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  bio?: string;
  created_at: string;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId, userName } = useLocalSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await api.getUser(userId as string);
      setUser(userData);

      try {
        const reviewsData = await api.getUserReviews?.(userId as string);
        if (reviewsData && Array.isArray(reviewsData)) {
          // Filter out reviews with missing reviewer data
          const validReviews = reviewsData.filter(review => review.reviewer);
          setReviews(validReviews);
          if (validReviews.length < reviewsData.length) {
            console.warn(`Filtered out ${reviewsData.length - validReviews.length} reviews with missing reviewer data`);
          }
        }
      } catch (err) {
        console.warn('Reviews endpoint may not exist or failed:', err);
        setReviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'No ratings';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* User Avatar and Name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>
            {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Community Member'}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.phone_number && <Text style={styles.userPhone}>{user.phone_number}</Text>}
        </View>

        {/* Bio Section */}
        {user.bio && (
          <>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          </>
        )}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{averageRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>⭐</Text>
            <Text style={styles.statLabel}>{reviews.length > 0 ? 'Trusted' : 'New'}</Text>
          </View>
        </View>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewBox}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text style={styles.reviewerName}>
                      {review.reviewer 
                        ? `${review.reviewer.first_name} ${review.reviewer.last_name}`
                        : 'Anonymous Reviewer'}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{review.rating}⭐</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </>
        )}

        {reviews.length === 0 && (
          <View style={styles.noReviews}>
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#f4f4e9',
    borderRadius: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e2e4d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#797c6f',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#797c6f',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
    marginTop: 20,
    marginBottom: 8,
  },
  bioBox: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 14,
    color: '#5d6054',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3c6a35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#797c6f',
    fontWeight: '600',
  },
  reviewBox: {
    backgroundColor: '#f4f4e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#303429',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#797c6f',
  },
  ratingBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e4d4',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3c6a35',
  },
  reviewComment: {
    fontSize: 13,
    color: '#5d6054',
    lineHeight: 20,
  },
  noReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#797c6f',
  },
  errorText: {
    fontSize: 16,
    color: '#a73b21',
    textAlign: 'center',
    marginTop: 20,
  },
});
