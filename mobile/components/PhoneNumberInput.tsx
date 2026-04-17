import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import countriesData from '../countries_phone_number.json';

interface Country {
  code: string;
  label: string;
  phone: string;
  phoneLength: number | number[];
  suggested?: boolean;
  min?: number;
  max?: number;
}

interface PhoneNumberInputProps {
  value: string;
  onChangeText: (phone: string) => void;
  isValid?: boolean;
  hasError?: boolean;
  validationErrors?: string[];
  placeholder?: string;
  editable?: boolean;
  onCountryChange?: (country: Country) => void;
}

export default function PhoneNumberInput({
  value,
  onChangeText,
  isValid = false,
  hasError = false,
  validationErrors = [],
  placeholder = 'Enter phone number',
  editable = true,
  onCountryChange,
}: PhoneNumberInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    (countriesData as Country[]).find((c) => c.code === 'US') ||
      (countriesData as Country[])[0]
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show suggested countries first
      const suggested = (countriesData as Country[]).filter((c) => c.suggested);
      const others = (countriesData as Country[]).filter((c) => !c.suggested);
      return [...suggested, ...others];
    }

    const query = searchQuery.toLowerCase();
    return (countriesData as Country[]).filter(
      (c) =>
        c.label.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.phone.includes(query)
    );
  }, [searchQuery]);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
    onCountryChange?.(country);
  };

  // Extract just the number part (without country code)
  const phoneNumberDisplay = value.startsWith('+' + selectedCountry.phone)
    ? value.replace('+' + selectedCountry.phone, '').trim()
    : value;

  const handlePhoneChange = (text: string) => {
    // Remove non-numeric characters except spaces and hyphens for display
    const cleaned = text.replace(/[^\d\s\-]/g, '');
    // Construct full number with country code
    const fullNumber = '+' + selectedCountry.phone + cleaned;
    onChangeText(fullNumber);
  };

  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#303429', marginBottom: 8 }}>
        Phone Number
      </Text>

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {/* Country Code Dropdown */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          disabled={!editable}
          style={{
            flex: 0.35,
            height: 48,
            borderRadius: 12,
            backgroundColor: hasError ? '#ffe6e0' : '#f4f4e9',
            borderWidth: hasError ? 1 : 0,
            borderColor: hasError ? '#a73b21' : '#f4f4e9',
            paddingHorizontal: 12,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#303429' }}>
            +{selectedCountry.phone}
          </Text>
          <Text style={{ fontSize: 12, color: '#797c6f' }}>▼</Text>
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={{
            flex: 0.65,
            height: 48,
            borderRadius: 12,
            backgroundColor: value && hasError ? '#ffe6e0' : '#f4f4e9',
            borderWidth: value && hasError ? 1 : 0,
            borderColor: isValid && value ? '#2f7d3f' : hasError ? '#a73b21' : '#f4f4e9',
            paddingHorizontal: 16,
            fontSize: 16,
            color: '#303429',
          }}
          placeholder={placeholder}
          placeholderTextColor="#b1b3a5"
          value={phoneNumberDisplay}
          onChangeText={handlePhoneChange}
          editable={editable}
          keyboardType="phone-pad"
        />
      </View>

      {/* Validation Messages */}
      {value && (
        <View style={{ marginTop: 8 }}>
          {isValid ? (
            <Text style={{ fontSize: 12, color: '#2f7d3f', fontWeight: '500' }}>
              ✓ Valid phone number
            </Text>
          ) : (
            validationErrors.length > 0 && (
              <View>
                {validationErrors.map((error, idx) => (
                  <Text key={idx} style={{ fontSize: 12, color: '#a73b21', fontWeight: '500' }}>
                    ✗ {error}
                  </Text>
                ))}
              </View>
            )
          )}
        </View>
      )}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet"
        animationType="slide"
      >
        <View style={{ flex: 1, backgroundColor: '#fafaf0' }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e8e8dc',
              paddingTop: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#303429', marginBottom: 12 }}>
              Select Country
            </Text>
            {/* Search Input */}
            <TextInput
              style={{
                height: 40,
                borderRadius: 8,
                backgroundColor: '#f4f4e9',
                paddingHorizontal: 12,
                fontSize: 14,
                color: '#303429',
              }}
              placeholder="Search country or code..."
              placeholderTextColor="#b1b3a5"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectCountry(item)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0e5',
                  backgroundColor: selectedCountry.code === item.code ? '#f0f8f5' : '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#303429',
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#797c6f',
                      marginTop: 2,
                    }}
                  >
                    +{item.phone}
                  </Text>
                </View>
                {selectedCountry.code === item.code && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#3c6a35',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyState={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 14, color: '#797c6f' }}>No countries found</Text>
              </View>
            }
          />

          {/* Close Button */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: '#e8e8dc',
              backgroundColor: '#f4f4e9',
            }}
          >
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: '#3c6a35',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
