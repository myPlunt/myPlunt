import { Pressable, Text, View } from 'react-native';

import type { Post } from '@/lib/post/types';

export type PostFilterValue = 'all' | Post['type'];

const FILTERS: { value: PostFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'question', label: 'Questions' },
  { value: 'new_plant', label: 'New plants' },
  { value: 'new_photo', label: 'New photos' },
];

interface PostFilterProps {
  value: PostFilterValue;
  onChange: (value: PostFilterValue) => void;
}

/** Pills above the user's posts on their profile: All · Questions · New plants · New photos. */
export function PostFilter({ value, onChange }: PostFilterProps) {
  return (
    // Wraps instead of scrolling, so all four stay visible on narrow phones.
    <View accessibilityRole="tablist" className="flex-row flex-wrap gap-2">
      {FILTERS.map(({ value: filter, label }) => {
        const selected = filter === value;
        return (
          <Pressable
            key={filter}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            onPress={() => onChange(filter)}
            className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
              selected ? 'border-action-primary bg-action-primary' : 'border-input-border bg-background-element'
            }`}>
            <Text className={`type-label ${selected ? 'text-background-element' : 'text-text-secondary'}`}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
