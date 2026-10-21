import { Tabs } from '@/components/ui/tabs';

export type FriendsTab = 'find' | 'friends' | 'requests';

interface FriendsTabsProps {
  tab: FriendsTab;
  onChange: (tab: FriendsTab) => void;
  /** Received requests waiting for an answer; shown as a badge on Requests when above 0. */
  requestCount: number;
}

/** The Friends screen's tabs: Find · Friends · Requests. */
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
