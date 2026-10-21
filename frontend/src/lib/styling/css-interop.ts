import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import { Animated as CoreAnimated } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// NativeWind only maps className -> style for React Native core components.
// Third-party components we style with classes are registered here once;
// this file is imported by the root layout.
cssInterop(Image, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
// React Native's own Animated.View: the notification toggles animate colours, which it handles.
cssInterop(CoreAnimated.View, { className: 'style' });
