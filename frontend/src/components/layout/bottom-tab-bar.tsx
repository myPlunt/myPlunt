import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        className="flex-1 items-center gap-1 py-2 active:opacity-70">
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
        {/* Shown but disabled until the Plantdex (regional plants) endpoint exists. */}
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Plantdex"
          disabled
          className="flex-1 items-center gap-1 py-2 opacity-50">
          <SymbolView
            name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }}
            tintColor={theme.tabInactive}
            size={24}
          />
          <Text className="type-label text-tab-inactive">Plantdex</Text>
        </Pressable>
        <View className="flex-1 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add plant or planter"
            onPress={() => router.push('/add')}
            className="-mt-6 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-80"
            style={Shadow.card}>
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
