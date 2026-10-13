import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Shadow } from '@/constants/theme';
import type { RegionProgress } from '@/features/pluntdex/filter';
import { useTheme } from '@/hooks/use-theme';

const ALL_REGIONS_LABEL = 'All regions';

interface RegionSelectProps {
  regions: RegionProgress[];
  selected: string | null;
  onSelect: (region: string | null) => void;
}

/**
 * A chip-shaped dropdown next to the Pluntdex filter chips: shows the picked region and
 * opens a list of every region with how many of its species are discovered. Same modal as PlanterSelect, so both platforms match.
 */
export function RegionSelect({ regions, selected, onSelect }: RegionSelectProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  function choose(region: string | null) {
    onSelect(region);
    setIsOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Region"
        accessibilityValue={{ text: selected ?? ALL_REGIONS_LABEL }}
        onPress={() => setIsOpen(true)}
        className={`h-8 shrink flex-row items-center gap-2 rounded-full border-[1.5px] px-3 active:opacity-70 ${
          selected ? 'border-primary bg-primary' : 'border-input-border bg-background-element'
        }`}>
        {/* tintColor is a colour prop, so it reads the theme instead of a class. */}
        <SymbolView
          name={{ ios: 'globe.europe.africa.fill', android: 'public', web: 'public' }}
          tintColor={selected ? theme.backgroundElement : theme.accent}
          size={16}
        />
        <Text
          className={`type-body-medium shrink ${selected ? 'text-background-element' : 'text-text'}`}
          numberOfLines={1}>
          {selected ?? 'Region'}
        </Text>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          tintColor={selected ? theme.backgroundElement : theme.textSecondary}
          size={12}
        />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => setIsOpen(false)}
            className="absolute inset-0 bg-text opacity-40"
          />
          {/* Shadow tokens set both iOS shadow* and Android elevation. */}
          <View
            className="max-h-[70%] w-full max-w-[360px] gap-2 rounded-2xl bg-background-element p-4"
            style={Shadow.card}>
            <Text className="type-subtitle-small text-text">Choose a region</Text>
            <ScrollView accessibilityRole="radiogroup" className="grow-0">
              {[null, ...regions].map((region) => {
                const name = region?.name ?? null;
                const complete = region !== null && region.discovered === region.total;
                return (
                  <Pressable
                    key={name ?? 'all'}
                    accessibilityRole="radio"
                    accessibilityLabel={
                      region ? `${region.name}, ${region.discovered} of ${region.total} discovered` : ALL_REGIONS_LABEL
                    }
                    accessibilityState={{ checked: name === selected }}
                    onPress={() => choose(name)}
                    className="flex-row items-center gap-3 py-3 active:opacity-70">
                    <Text
                      className={`type-body-large shrink grow ${region === null ? 'text-text-secondary' : 'text-text'}`}
                      numberOfLines={1}>
                      {name ?? ALL_REGIONS_LABEL}
                    </Text>
                    {region && (
                      <Text className={`type-body-medium ${complete ? 'text-primary' : 'text-text-secondary'}`}>
                        {region.discovered} / {region.total}
                      </Text>
                    )}
                    {/* Always takes its space, so the counts line up whichever row is picked. */}
                    <View className="w-4">
                      {name === selected && (
                        <SymbolView
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          tintColor={theme.primary}
                          size={16}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
