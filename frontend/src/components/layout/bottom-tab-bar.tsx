import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStore } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

type SymbolName = SymbolViewProps['name'];

interface TabConfig {
  route: string;
  label: string;
  icon: SymbolName;
  worksOffline?: boolean;
}

const feedTab: TabConfig = {
  route: 'index',
  label: 'Feed',
  icon: { ios: 'house.fill', android: 'home', web: 'home' },
};
const pluntdexTab: TabConfig = {
  route: 'pluntdex',
  label: 'PluntDex',
  icon: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
};
const rightTabs: TabConfig[] = [
  {
    route: 'garden',
    label: 'Garden',
    icon: { ios: 'leaf.fill', android: 'potted_plant', web: 'potted_plant' },
    worksOffline: true,
  },
  {
    route: 'profile',
    label: 'Profile',
    icon: { ios: 'person.fill', android: 'person', web: 'person' },
  },
];

// Our own tab bar: the default is Liquid Glass on iOS 26, and Add opens a screen instead of a tab.
export function BottomTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const activeRoute = state.routes[state.index]?.name;
  const addOpen = usePathname() === '/add';
  const { step } = useOnboardingStore();
  const locked = step !== null;
  // Except Add in the first-plant step: it's another way to do what the card asks.
  const isPlantStep = step === 'plant';
  const addLocked = locked && !isPlantStep;
  const { isOffline, explainOffline } = useNetworkStore();

  function renderTab({ route, label, icon, worksOffline }: TabConfig) {
    const target = state.routes.find((r) => r.name === route);
    if (!target) return null;
    const focused = activeRoute === route;
    const offline = isOffline && !worksOffline;

    function onPress() {
      if (offline) {
        explainOffline(label);
        return;
      }
      // Emitting tabPress keeps the navigator's behaviour (screens can listen for it).
      const event = emitter.emit({ type: 'tabPress', target: target!.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigateToTab(target!.key);
      }
    }

    return (
      <Pressable
        key={route}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused, disabled: locked }}
        // Offline it still takes the press (to explain), so it isn't marked disabled; the hint says it.
        accessibilityHint={offline ? "Doesn't work offline" : undefined}
        disabled={locked}
        onPress={onPress}
        className={`flex-1 items-center gap-1 py-2 active:opacity-70 ${(locked && !focused) || offline ? 'opacity-40' : ''}`}>
        <SymbolView
          name={icon}
          tintColor={focused ? theme.tabActive : theme.tabInactive}
          size={24}
        />
        <Text className={`type-label ${focused ? 'text-tab-active' : 'text-tab-inactive'}`}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View
      className="border-t border-border bg-background-element"
      style={{ paddingBottom: insets.bottom }}>
      <View className="w-full max-w-content flex-row items-center self-center px-2">
        {renderTab(feedTab)}
        {renderTab(pluntdexTab)}
        <View className="flex-1 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add plant"
            accessibilityState={{ selected: addOpen, disabled: addLocked }}
            accessibilityHint={isOffline ? "Doesn't work offline" : undefined}
            disabled={addLocked}
            onPress={() => (isOffline ? explainOffline('Adding plants') : router.push('/add'))}
            className={`-mt-6 h-14 w-14 items-center justify-center rounded-full active:opacity-80 ${
              addOpen ? 'bg-action-primary' : 'bg-primary'
            } ${addLocked || isOffline ? 'opacity-40' : ''}`}
            style={Shadow.card}>
            {/* Drawn around the button rather than as its border, so the bar's layout doesn't move. */}
            {isPlantStep && (
              <View pointerEvents="none" className="absolute -inset-1.5 rounded-full border-2 border-primary" />
            )}
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={theme.backgroundElement}
              size={28}
            />
          </Pressable>
        </View>
        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}
