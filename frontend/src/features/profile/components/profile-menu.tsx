import { useRouter, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Reanimated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export type MenuItem = { label: string; icon: SymbolViewProps['name']; destructive?: boolean } & (
  | { href: Href }
  | { onPress: () => void }
);

const profileItems: MenuItem[] = [
  { label: 'Open settings', href: '/settings', icon: { ios: 'gearshape.fill', android: 'settings', web: 'settings' } },
  { label: 'Open friends', href: '/friends', icon: { ios: 'person.2.fill', android: 'group', web: 'group' } },
  {
    label: 'Open notifications',
    href: '/inbox',
    icon: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  },
  {
    label: 'Open watering calendar',
    href: '/watering-calendar',
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  },
];

function CountBadge({ count }: { count: number }) {
  return (
    <View
      pointerEvents="none"
      className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1">
      <Text className="type-label text-background-element" style={{ includeFontPadding: false }}>
        {count > 9 ? '9+' : count}
      </Text>
    </View>
  );
}

// 22 matches the menu's icons, so the burger lines up with their column.
const BAR_WIDTHS = { closed: [22, 22, 22], open: [22, 15, 8] };

/** Three bars, not two symbols, so closed and open match on both platforms and can animate between them. */
interface ProfileMenuButtonProps {
  open: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  unreadCount?: number;
}

export function ProfileMenuButton({ open, onPress, onLayout, unreadCount = 0 }: ProfileMenuButtonProps) {
  // Created once; 0 is closed, 1 open.
  const [progress] = useState(() => new Animated.Value(open ? 1 : 0));

  useEffect(() => {
    // Width can't run on the native driver, and three small bars are cheap on the JS thread.
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [open, progress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Close menu' : unreadCount ? `Open menu, ${unreadCount} new notifications` : 'Open menu'}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      onLayout={onLayout}
      className="h-10 w-10 items-center justify-center active:opacity-70">
      <View className="h-[22px] w-[22px] items-start justify-between py-[2px]">
        {BAR_WIDTHS.closed.map((closedWidth, index) => (
          <Animated.View
            key={index}
            style={{
              width: progress.interpolate({ inputRange: [0, 1], outputRange: [closedWidth, BAR_WIDTHS.open[index]] }),
            }}>
            <View className="h-[2.5px] w-full rounded-full bg-action-primary" />
          </Animated.View>
        ))}
      </View>
      {!open && unreadCount > 0 && <CountBadge count={unreadCount} />}
    </Pressable>
  );
}

interface ProfileMenuProps {
  open: boolean;
  top: number;
  onClose: () => void;
  items?: MenuItem[];
  /** During the tour, the one page the step leads to (null for none); no dismiss layer, so the tour card stays pressable. */
  tourHref?: Href | null;
  unreadCount?: number;
}

/**
 * Always mounted, so the closing animation has something to run in. Render it as the screen's last
 * child, so it draws above the page on both platforms (Android draws later siblings on top).
 */
export function ProfileMenu({ open, top, onClose, items = profileItems, tourHref, unreadCount = 0 }: ProfileMenuProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <>
      {open && tourHref === undefined && <Pressable accessibilityLabel="Dismiss menu" onPress={onClose} className="absolute inset-0" />}
      {/* Same column as the header, so the icons line up under the burger. box-none lets presses beside them through. */}
      <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ top }}>
        <View pointerEvents="box-none" className="w-full max-w-content items-end px-6">
          {open &&
            items.map((item, index) => {
              const isTourItem = tourHref !== undefined && 'href' in item && item.href === tourHref;
              const locked = tourHref !== undefined && !isTourItem;
              const badge = 'href' in item && item.href === '/inbox' ? unreadCount : 0;
              return (
                <Reanimated.View
                  key={item.label}
                  entering={FadeInUp.delay(index * 90).duration(320)}
                  exiting={FadeOutUp.delay((items.length - 1 - index) * 70).duration(240)}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={badge ? `${item.label}, ${badge} new` : item.label}
                    accessibilityState={{ disabled: locked }}
                    disabled={locked}
                    onPress={() => {
                      onClose();
                      if ('href' in item) router.push(item.href);
                      else item.onPress();
                    }}
                    className={`h-10 w-10 items-center justify-center rounded-full active:opacity-70 ${
                      locked ? 'opacity-40' : ''
                    } ${isTourItem ? 'border-2 border-primary' : ''}`}>
                    <SymbolView name={item.icon} tintColor={item.destructive ? theme.error : theme.actionPrimary} size={22} />
                    {badge > 0 && <CountBadge count={badge} />}
                  </Pressable>
                </Reanimated.View>
              );
            })}
        </View>
      </View>
    </>
  );
}
