import type { ExpoConfig } from 'expo/config';

const isDev = process.env.APP_VARIANT === 'development';

const config: ExpoConfig = {
  name: isDev ? 'YOLO Detect (Dev)' : 'YOLO Detect',
  slug: 'yolo-detect',
  version: process.env.APP_VERSION ?? '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
  },
  android: {
    package: isDev ? 'com.demo.yolodetect.dev' : 'com.demo.yolodetect',
    versionCode: Number(process.env.APP_BUILD_NUMBER ?? 1),
    // expo-image-picker không tự khai báo, thiếu thì launchCameraAsync luôn bị từ chối quyền
    permissions: ['android.permission.CAMERA'],
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'react-native-fast-tflite',
    [
      'expo-image-picker',
      {
        cameraPermission: 'Ứng dụng cần camera để chụp ảnh nhận diện vật thể.',
        photosPermission: 'Ứng dụng cần truy cập ảnh để nhận diện vật thể.',
        microphonePermission: false,
      },
    ],
    [
      'expo-build-properties',
      {
        // Tắt R8 để không xoá mất class Nitro mà fast-tflite gọi qua JNI
        android: { enableMinifyInReleaseBuilds: false },
      },
    ],
  ],
};

export default config;
