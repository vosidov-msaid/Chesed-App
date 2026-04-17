import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(phoneNumber, password);
      router.replace('/(app)');
    } catch {
      Alert.alert('Login Failed', error || 'Invalid credentials');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafaf0', padding: 24 }}>
      {/* Header */}
      <View style={{ marginTop: 60, marginBottom: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#303429', marginBottom: 8 }}>
          Welcome Back
        </Text>
        <Text style={{ fontSize: 16, color: '#797c6f' }}>
          Sign in to continue helping your community
        </Text>
      </View>

      {/* Phone Input */}
      <View style={{ marginBottom: 20 }}>
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

      {/* Password Input */}
      <View style={{ marginBottom: 32 }}>
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
          placeholder="Enter your password"
          placeholderTextColor="#b1b3a5"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text style={{ color: '#a73b21', marginBottom: 16, fontSize: 14 }}>
          {error}
        </Text>
      )}

      {/* Login Button */}
      <TouchableOpacity
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: '#3c6a35',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      {/* Register Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
        <Text style={{ fontSize: 14, color: '#797c6f' }}>
          Don&apos;t have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#3c6a35' }}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
