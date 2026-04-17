import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { validatePhone } from '../../utils/validation';
import PhoneNumberInput from '../../components/PhoneNumberInput';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  // Live validation states
  const phoneValidation = validatePhone(phoneNumber);
  const isFormValid = phoneValidation.isValid && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix all validation errors');
      return;
    }

    await login(phoneNumber, password);
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

      {/* Phone Input with Country Dropdown */}
      <View style={{ marginBottom: 24 }}>
        <PhoneNumberInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          isValid={phoneValidation.isValid}
          hasError={phoneNumber !== '' && !phoneValidation.isValid}
          validationErrors={phoneValidation.errors}
          placeholder="Enter phone number"
          editable={!isLoading}
        />
      </View>

      {/* Password Input */}
      <View style={{ marginBottom: 24 }}>
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

      {/* Login Button */}
      <TouchableOpacity
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: isFormValid && !isLoading ? '#3c6a35' : '#b1b3a5',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: error ? 12 : 16,
        }}
        onPress={handleLogin}
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error && typeof error === 'string' && (
        <Text style={{ color: '#a73b21', marginBottom: 16, fontSize: 14, textAlign: 'center' }}>
          {error}
        </Text>
      )}

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
