import { render, screen, userEvent } from '@testing-library/react-native';
import { usePathname, useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { BottomTabBar } from '../bottom-tab-bar';

jest.mock('expo-router', () => ({ usePathname: jest.fn(), useRouter: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePathname = jest.mocked(usePathname);
const push = jest.fn();
const navigate = jest.fn();
const emit = jest.fn();
const user = userEvent.setup();

const routes = ['index', 'pluntdex', 'garden', 'profile'].map((name) => ({ key: `${name}-key`, name }));

// Only the parts of the navigator props the tab bar reads.
function tabBarProps(activeIndex: number) {
  return {
    state: { index: activeIndex, routes },
    navigation: { emit, navigate },
    insets: { top: 0, right: 0, bottom: 34, left: 0 },
  } as unknown as BottomTabBarProps;
}

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockedUsePathname.mockReturnValue('/');
  emit.mockReturnValue({ defaultPrevented: false });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('BottomTabBar', () => {
  it('shows Feed, PluntDex, Add, Garden and Profile in that order', async () => {
    await render(<BottomTabBar {...tabBarProps(0)} />);

    const labels = screen
      .getAllByRole(/^(tab|button)$/)
      .map((element) => element.props.accessibilityLabel);
    expect(labels).toEqual(['Feed', 'PluntDex', 'Add plant', 'Garden', 'Profile']);
  });

  it('marks only the current tab as selected', async () => {
    await render(<BottomTabBar {...tabBarProps(3)} />);

    expect(screen.getByRole('tab', { name: 'Profile' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Feed' })).not.toBeSelected();
  });

  it('switches to the pressed tab', async () => {
    await render(<BottomTabBar {...tabBarProps(0)} />);

    await user.press(screen.getByRole('tab', { name: 'Garden' }));

    expect(emit).toHaveBeenCalledWith({ type: 'tabPress', target: 'garden-key', canPreventDefault: true });
    expect(navigate).toHaveBeenCalledWith('garden', undefined);
  });

  it('does not navigate when the pressed tab is already open', async () => {
    await render(<BottomTabBar {...tabBarProps(2)} />);

    await user.press(screen.getByRole('tab', { name: 'Garden' }));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when a screen prevents the tab press', async () => {
    emit.mockReturnValue({ defaultPrevented: true });
    await render(<BottomTabBar {...tabBarProps(0)} />);

    await user.press(screen.getByRole('tab', { name: 'Garden' }));

    expect(navigate).not.toHaveBeenCalled();
  });

  it('switches to the Pluntdex', async () => {
    await render(<BottomTabBar {...tabBarProps(0)} />);

    await user.press(screen.getByRole('tab', { name: 'PluntDex' }));

    expect(navigate).toHaveBeenCalledWith('pluntdex', undefined);
  });

  it('opens the add screen from the middle button', async () => {
    await render(<BottomTabBar {...tabBarProps(0)} />);

    await user.press(screen.getByRole('button', { name: 'Add plant' }));

    expect(push).toHaveBeenCalledWith('/add');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the Add button as selected while the add screen is open', async () => {
    mockedUsePathname.mockReturnValue('/add');
    await render(<BottomTabBar {...tabBarProps(0)} />);

    expect(screen.getByRole('button', { name: 'Add plant' })).toBeSelected();
  });

  it('does not show the Add button as selected on the tabs', async () => {
    await render(<BottomTabBar {...tabBarProps(0)} />);

    expect(screen.getByRole('button', { name: 'Add plant' })).not.toBeSelected();
  });
});
