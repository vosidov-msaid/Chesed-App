import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { validatePhone, validatePassword, validateEmail } from '../../utils/validation';
import { ValidationFeedback, PasswordRequirement, PasswordStrengthBar } from '../../components/ValidationFeedback';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Live validation states
  const phoneValidation = validatePhone(phoneNumber);
  const passwordValidation = validatePassword(password);
  const emailIsValid = validateEmail(email);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Calculate password strength
  const getPasswordStrength = () => {
    const checks = [
      passwordValidation.hasMinLength,
      passwordValidation.hasUppercase,
      passwordValidation.hasLowercase,
      passwordValidation.hasDigit,
    ].filter(Boolean).length;

    if (checks <= 1) return 'weak';
    if (checks === 2) return 'fair';
    if (checks === 3) return 'good';
    return 'strong';
  };

  const isFormValid =
    phoneValidation.isValid &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailIsValid &&
    passwordValidation.isValid &&
    passwordsMatch;

  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix all errors before proceeding');
      return;
    }

    try {
      await register(phoneNumber, firstName, lastName, email, password);
      Alert.alert(
        'Registration Successful',
        'Check your email to verify your account before logging in.'
      );
      router.replace('/(auth)/login');
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
        <View style={{ marginBottom: 20 }}>
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
            onChangeText={setPhoneNumber}
            editable={!isLoading}
            keyboardType="phone-pad"
          />
          {phoneNumber && (
            <>
              {phoneValidation.isValid ? (
                <ValidationFeedback isValid message="✓ Valid phone number" />
              ) : (
                phoneValidation.errors.map((e, idx) => (
                  <ValidationFeedback key={idx} isValid={false} message={`✗ ${e}`} />
                ))
              )}
            </>
          )}
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
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
            Email
          </Text>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: email && !emailIsValid ? '#ffe6e0' : '#f4f4e9',
              borderWidth: email && !emailIsValid ? 1 : 0,
              borderColor: emailIsValid && email ? '#2f7d3f' : '#a73b21',
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
          {email && (
            <ValidationFeedback isValid={emailIsValid} message={emailIsValid ? '✓ Valid email' : '✗ Invalid email'} />
          )}
        </View>

        {/* Password */}
        <View style={{ marginBottom: 20 }}>
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
            placeholder="Enter password (min 8 chars)"
            placeholderTextColor="#b1b3a5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          {password && (
            <View>
              <PasswordStrengthBar strength={getPasswordStrength()} />
              <PasswordRequirement met={passwordValidation.hasMinLength} label="Minimum 8 characters" />
              <PasswordRequirement met={passwordValidation.hasUppercase} label="One uppercase letter (A-Z)" />
              <PasswordRequirement met={passwordValidation.hasLowercase} label="One lowercase letter (a-z)" />
              <PasswordRequirement met={passwordValidation.hasDigit} label="One digit (0-9)" />
            </View>
          )}
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
              backgroundColor:
                confirmPassword && !passwordsMatch ? '#ffe6e0' : '#f4f4e9',
              borderWidth: confirmPassword && !passwordsMatch ? 1 : 0,
              borderColor: passwordsMatch && confirmPassword ? '#2f7d3f' : '#a73b21',
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
          {confirmPassword && (
            <ValidationFeedback isValid={passwordsMatch} message={passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'} />
          )}
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
            backgroundColor: isFormValid ? '#3c6a35' : '#b1b3a5',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleRegister}
          disabled={isLoading || !isFormValid}
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
