import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { validatePhone, validatePassword } from '../../utils/validation';
import { ValidationFeedback } from '../../components/ValidationFeedback';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error: authError } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Live validation states
  const phoneValidation = validatePhone(phoneNumber);
  const passwordValidation = validatePassword(password);

  const isFormValid = phoneValidation.isValid && passwordValidation.isValid;

  const handleLogin = async () => {
    setLocalError('');

    if (!isFormValid) {
      setLocalError('Please fix all validation errors');
      return;
    }

    try {
      console.log('[LoginScreen] Attempting login...');
      await login(phoneNumber, password);
      console.log('[LoginScreen] Login successful, waiting for navigation...');
      // Don't set error or navigate manually - isSignedIn state change will trigger navigation
    } catch (error: any) {
      console.error('[LoginScreen] Login error:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Login failed';
      setLocalError(errorMsg);
    }
  };

  const displayError = localError || authError;

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
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
          Phone Number
        </Text>
        <TextInput
          style={{
            height: 48,
            borderRadius: 12,
            backgroundColor: phoneNumber && !phoneValidation.isValid ? '#ffe6e0' : '#f4f4e9',
            borderWidth: phoneNumber && !phoneValidation.isValid ? 1 : 0,
            borderColor: phoneValidation.isValid && phoneNumber ? '#2f7d3f' : '#a73b21',
            paddingHorizontal: 16,
            fontSize: 16,
            color: '#303429',
          }}
          placeholder="+972..."
          placeholderTextColor="#b1b3a5"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            setLocalError('');
          }}
          editable={!isLoading}
          keyboardType="phone-pad"
        />
        {phoneNumber && !phoneValidation.isValid && (
          <ValidationFeedback isValid={false} message="✗ Incorrect phone_number" />
        )}
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
            backgroundColor: password && !passwordValidation.isValid ? '#ffe6e0' : '#f4f4e9',
            borderWidth: password && !passwordValidation.isValid ? 1 : 0,
            borderColor: passwordValidation.isValid && password ? '#2f7d3f' : '#a73b21',
            paddingHorizontal: 16,
            fontSize: 16,
            color: '#303429',
          }}
          placeholder="Enter your password"
          placeholderTextColor="#b1b3a5"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setLocalError('');
          }}
          editable={!isLoading}
        />
        {password && (
          <View>
            {passwordValidation.isValid ? (
              <ValidationFeedback isValid message="✓ Strong password" />
            ) : (
              <View>
                <ValidationFeedback
                  isValid={passwordValidation.hasMinLength}
                  message={`${passwordValidation.hasMinLength ? '✓' : '✗'} Minimum 8 characters`}
                />
                <ValidationFeedback
                  isValid={passwordValidation.hasUppercase}
                  message={`${passwordValidation.hasUppercase ? '✓' : '✗'} One uppercase letter`}
                />
                <ValidationFeedback
                  isValid={passwordValidation.hasLowercase}
                  message={`${passwordValidation.hasLowercase ? '✓' : '✗'} One lowercase letter`}
                />
                <ValidationFeedback
                  isValid={passwordValidation.hasDigit}
                  message={`${passwordValidation.hasDigit ? '✓' : '✗'} One digit`}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Error Message */}
      {displayError && (
        <View style={{ backgroundColor: '#ffe6e0', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#a73b21' }}>
          <Text style={{ color: '#a73b21', fontSize: 14, fontWeight: '500' }}>
            {displayError}
          </Text>
        </View>
      )}

      {/* Login Button */}
      <TouchableOpacity
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: isFormValid && !isLoading ? '#3c6a35' : '#b1b3a5',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
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
