import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!phoneNumber || !firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await register(phoneNumber, firstName, lastName, email, password);
      router.replace('/(app)');
    } catch {
      Alert.alert('Registration Failed', error || 'Please try again');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fafaf0' }}>
      <View style={{ padding: 24 }}>
        {/* Header */}
        <View style={{ marginTop: 40, marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#303429', marginBottom: 8 }}>
            Join Us
          </Text>
          <Text style={{ fontSize: 16, color: '#797c6f' }}>
            Create your account and start helping
          </Text>
        </View>

        {/* Phone Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            Phone Number
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f4f4e9',
              paddingHorizontal: 16,
              fontSize: 16,
              color: '#303429',
            }}
            placeholder="+972..."
            placeholderTextColor="#b1b3a5"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!isLoading}
            keyboardType="phone-pad"
          />
        </View>

        {/* First Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            First Name
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f4f4e9',
              paddingHorizontal: 16,
              fontSize: 16,
              color: '#303429',
            }}
            placeholder="John"
            placeholderTextColor="#b1b3a5"
            value={firstName}
            onChangeText={setFirstName}
            editable={!isLoading}
          />
        </View>

        {/* Last Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            Last Name
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f4f4e9',
              paddingHorizontal: 16,
              fontSize: 16,
              color: '#303429',
            }}
            placeholder="Doe"
            placeholderTextColor="#b1b3a5"
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading}
          />
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            Email
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f4f4e9',
              paddingHorizontal: 16,
              fontSize: 16,
              color: '#303429',
            }}
            placeholder="john@example.com"
            placeholderTextColor="#b1b3a5"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
          />
        </View>

        {/* Password */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            Password
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f4f4e9',
              paddingHorizontal: 16,
              fontSize: 16,
              color: '#303429',
            }}
            placeholder="Enter password"
            placeholderTextColor="#b1b3a5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
        </View>

        {/* Confirm Password */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            Confirm Password
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f4f4e9',
              paddingHorizontal: 16,
              fontSize: 16,
              color: '#303429',
            }}
            placeholder="Confirm password"
            placeholderTextColor="#b1b3a5"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
          />
        </View>

        {/* Error Message */}
        {error && (
          <Text style={{ color: '#a73b21', marginBottom: 16, fontSize: 14 }}>
            {error}
          </Text>
        )}

        {/* Register Button */}
        <TouchableOpacity
          style={{
            height: 48,
            borderRadius: 12,
            backgroundColor: '#3c6a35',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ fontSize: 14, color: '#797c6f' }}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#3c6a35' }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
