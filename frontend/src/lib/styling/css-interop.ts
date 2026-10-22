import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import { Animated as CoreAnimated } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// NativeWind only maps className for React Native's core components; others are registered here.
cssInterop(Image, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
// React Native's own Animated.View: the notification toggles animate colours, which it handles.
cssInterop(CoreAnimated.View, { className: 'style' });
