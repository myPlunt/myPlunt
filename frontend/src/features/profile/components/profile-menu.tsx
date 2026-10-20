import { useRouter, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Reanimated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

const items: { label: string; href: Href; icon: SymbolViewProps['name'] }[] = [
  { label: 'Open settings', href: '/settings', icon: { ios: 'gearshape.fill', android: 'settings', web: 'settings' } },
  { label: 'Open friends', href: '/friends', icon: { ios: 'person.2.fill', android: 'group', web: 'group' } },
  {
    label: 'Open watering calendar',
    href: '/watering-calendar',
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  },
];

// The burger's three bars fill the same 22×22 square as the menu's icons, so it lines up
// with them in the column. Closed they're all full width; open they shorten from the top
// down into a left-aligned fan.
const BAR_WIDTHS = { closed: [22, 22, 22], open: [22, 15, 8] };

/**
 * The burger in the profile's header. Drawn from three bars instead of two symbols, so
 * closed and open have exactly the same height and line weight on both platforms (the
 * system's burger and "sort" icons differ), and the bars can shrink smoothly between them.
 */
interface ProfileMenuButtonProps {
  open: boolean;
  onPress: () => void;
  /** Reports the button's box, so the menu can start right under it. */
  onLayout: (event: LayoutChangeEvent) => void;
}

export function ProfileMenuButton({ open, onPress, onLayout }: ProfileMenuButtonProps) {
  // Created once; 0 is closed, 1 open.
  const [progress] = useState(() => new Animated.Value(open ? 1 : 0));

  useEffect(() => {
    // Width can't run on the native driver, and three small bars are cheap on the JS thread.
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [open, progress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Close menu' : 'Open menu'}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      onLayout={onLayout}
      className="h-10 w-10 items-center justify-center active:opacity-70">
      <View className="h-[22px] w-[22px] items-start justify-between py-[2px]">
        {BAR_WIDTHS.closed.map((closedWidth, index) => (
          // The width is animated, so it's a style; the bar's look is a plain View inside,
          // since react-native's Animated.View isn't registered for className.
          <Animated.View
            key={index}
            style={{
              width: progress.interpolate({ inputRange: [0, 1], outputRange: [closedWidth, BAR_WIDTHS.open[index]] }),
            }}>
            <View className="h-[2.5px] w-full rounded-full bg-action-primary" />
          </Animated.View>
        ))}
      </View>
    </Pressable>
  );
}

interface ProfileMenuProps {
  open: boolean;
  /** Where the burger's 40px box ends, so the icons continue the column at the same step. */
  top: number;
  onClose: () => void;
  /**
   * During the tour: the one page the step leads to (null for none). The other icons are off,
   * that one is ringed, and there's no dismiss layer, so the tour card below stays pressable.
   */
  tourHref?: Href | null;
}

/**
 * The profile menu's icons in a column under the burger, with no panel behind them. They
 * drop in one after another from just above their place and rise back up in reverse order
 * when the menu closes. Always mounted, so the closing animation has something to run in;
 * only the icons and the dismiss layer come and go. Rendered as the screen's last child, so
 * it draws above the page on both platforms (Android draws later siblings on top).
 */
export function ProfileMenu({ open, top, onClose, tourHref }: ProfileMenuProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <>
      {/* Covers the whole screen while open, so a press anywhere else closes the menu. */}
      {open && tourHref === undefined && <Pressable accessibilityLabel="Dismiss menu" onPress={onClose} className="absolute inset-0" />}
      {/* The same column as the header (max-w-content, px-6), so the icons line up under the
          burger on any screen width. box-none lets presses beside the icons reach the page
          (or the dismiss layer) below. A style, because the header's height is measured. */}
      <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ top }}>
        <View pointerEvents="box-none" className="w-full max-w-content items-end px-6">
          {open &&
            items.map((item, index) => {
              const isTourItem = tourHref !== undefined && item.href === tourHref;
              const locked = tourHref !== undefined && !isTourItem;
              return (
                // FadeInUp starts 25px above and slides down into place, FadeOutUp goes back up.
                // Staggered so the menu unrolls downwards and rolls up from the bottom; reanimated
                // skips both when the system's reduce motion is on.
                <Reanimated.View
                  key={item.label}
                  entering={FadeInUp.delay(index * 90).duration(320)}
                  exiting={FadeOutUp.delay((items.length - 1 - index) * 70).duration(240)}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ disabled: locked }}
                    disabled={locked}
                    onPress={() => {
                      onClose();
                      router.push(item.href);
                    }}
                    className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${
                      locked ? 'opacity-40' : ''
                    } ${isTourItem ? 'border-2 border-primary' : ''}`}>
                    <SymbolView name={item.icon} tintColor={theme.actionPrimary} size={22} />
                  </Pressable>
                </Reanimated.View>
              );
            })}
        </View>
      </View>
    </>
  );
}
