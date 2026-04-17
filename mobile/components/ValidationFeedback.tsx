import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ValidationFeedbackProps {
  isValid: boolean | null;
  message?: string;
  showIcon?: boolean;
}

/**
 * Displays validation feedback with icon and message.
 * Used for live validation indicators.
 */
export function ValidationFeedback({ isValid, message, showIcon = true }: ValidationFeedbackProps) {
  if (isValid === null || isValid === undefined) {
    return null;
  }

  const color = isValid ? '#2f7d3f' : '#a73b21';
  const icon = isValid ? 'check-circle' : 'alert-circle';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 4 }}>
      {showIcon && <MaterialCommunityIcons name={icon} size={16} color={color} style={{ marginRight: 6 }} />}
      {message && <Text style={{ fontSize: 12, color, fontWeight: '500' }}>{message}</Text>}
    </View>
  );
}

interface PasswordRequirementProps {
  met: boolean;
  label: string;
}

/**
 * Shows individual password requirement with checkmark.
 */
export function PasswordRequirement({ met, label }: PasswordRequirementProps) {
  const color = met ? '#2f7d3f' : '#b1b3a5';
  const icon = met ? 'check-circle' : 'circle-outline';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
      <MaterialCommunityIcons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
      <Text style={{ fontSize: 12, color, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

interface PasswordStrengthProps {
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Visual password strength indicator.
 */
export function PasswordStrengthBar({ strength }: PasswordStrengthProps) {
  const strengthColors = {
    weak: '#a73b21',
    fair: '#dab54a',
    good: '#3c6a35',
    strong: '#2f7d3f',
  };

  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };

  const widths = {
    weak: '25%',
    fair: '50%',
    good: '75%',
    strong: '100%',
  };

  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <View
        style={{
          height: 4,
          backgroundColor: '#e8e8e0',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: widths[strength],
            backgroundColor: strengthColors[strength],
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, fontWeight: '600' }}>
        Password Strength: {strengthLabels[strength]}
      </Text>
    </View>
  );
}
