import { Tabs } from '@/components/ui/tabs';

export type FriendsTab = 'find' | 'friends' | 'requests';

interface FriendsTabsProps {
  tab: FriendsTab;
  onChange: (tab: FriendsTab) => void;
  requestCount: number;
}

export function FriendsTabs({ tab, onChange, requestCount }: FriendsTabsProps) {
  return (
    <Tabs
      tabs={[
        { value: 'find', label: 'Find' },
        { value: 'friends', label: 'Friends' },
        { value: 'requests', label: 'Requests', badge: requestCount },
      ]}
      value={tab}
      onChange={onChange}
    />
  );
}
