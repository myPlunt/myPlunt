import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding-store';

type SymbolName = SymbolViewProps['name'];

interface TabConfig {
  route: string;
  label: string;
  icon: SymbolName;
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
  },
  {
    route: 'profile',
    label: 'Profile',
    icon: { ios: 'person.fill', android: 'person', web: 'person' },
  },
];

// Our own tab bar instead of the default one, so both platforms get the same
// look (the default renders as Liquid Glass on iOS 26) and the Add button can
// open a screen instead of being a tab.
export function BottomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const activeRoute = state.routes[state.index]?.name;
  // The Add screen opens above the tabs (a sheet on iOS), so the bar can still be
  // seen behind it; the button turns Hunter Green like an active tab meanwhile.
  const addOpen = usePathname() === '/add';
  // During the tour the bar can't take the user away from the step on screen; the step's
  // card moves the tour on, and the bar comes back when it ends.
  const { step } = useOnboardingStore();
  const locked = step !== null;
  // Except + in the first-plant step: it's another way to add the plant the card asks for,
  // so it stays on and gets a ring like the other controls the tour points at.
  const isPlantStep = step === 'plant';
  const addLocked = locked && !isPlantStep;

  function renderTab({ route, label, icon }: TabConfig) {
    const target = state.routes.find((r) => r.name === route);
    if (!target) return null;
    const focused = activeRoute === route;

    function onPress() {
      // Emitting tabPress keeps the navigator's own behaviour (e.g. a screen
      // can listen for it) before we switch tabs.
      const event = navigation.emit({ type: 'tabPress', target: target!.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(target!.name, target!.params);
      }
    }

    return (
      <Pressable
        key={route}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused, disabled: locked }}
        disabled={locked}
        onPress={onPress}
        // The tab the user is on stays as it is; only the ones that would leave the step fade.
        className={`flex-1 items-center gap-1 py-2 active:opacity-70 ${locked && !focused ? 'opacity-40' : ''}`}>
        {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
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
      // The bottom inset (home indicator on iOS, gesture/nav bar on Android) is a
      // runtime value, so it can't be a class.
      style={{ paddingBottom: insets.bottom }}>
      <View className="w-full max-w-content flex-row items-center self-center px-2">
        {renderTab(feedTab)}
        {renderTab(pluntdexTab)}
        <View className="flex-1 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add plant"
            accessibilityState={{ selected: addOpen, disabled: addLocked }}
            disabled={addLocked}
            onPress={() => router.push('/add')}
            className={`-mt-6 h-14 w-14 items-center justify-center rounded-full active:opacity-80 ${
              addOpen ? 'bg-action-primary' : 'bg-primary'
            } ${addLocked ? 'opacity-40' : ''}`}
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
