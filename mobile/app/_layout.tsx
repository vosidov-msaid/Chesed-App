import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { isLoading, isSignedIn, hydrateAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      await hydrateAuth();
    };
    initAuth();
  }, [hydrateAuth]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf0' }}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
