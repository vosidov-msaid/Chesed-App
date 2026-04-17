import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Chesed',
  slug: 'chesed-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'chesed',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#fafaf0',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTabletMode: true,
    requireFullScreen: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#fafaf0',
    },
    package: 'com.chesedapp.mobile',
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
    router: {
      origin: false,
    },
    eas: {
      projectId: 'chesed-app-id',
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/your-project-id',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
});
