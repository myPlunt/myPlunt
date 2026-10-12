import { render, screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { ConfirmDialog } from '../confirm-dialog';

const user = userEvent.setup();
const onConfirm = jest.fn();
const onCancel = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

function renderDialog(props: Partial<ComponentProps<typeof ConfirmDialog>> = {}) {
  return render(
    <ConfirmDialog
      visible
      title="Delete Vera?"
      message="This can't be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
}

describe('ConfirmDialog', () => {
  it('shows the question and confirms when asked', async () => {
    await renderDialog();

    expect(screen.getByRole('header', { name: 'Delete Vera?' })).toBeOnTheScreen();
    expect(screen.getByText("This can't be undone.")).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels from the Cancel button and from tapping outside', async () => {
    await renderDialog();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await user.press(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("can't be dismissed while the action runs", async () => {
    await renderDialog({ loading: true });

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await user.press(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows an error', async () => {
    await renderDialog({ error: 'Could not reach the server' });

    expect(screen.getByText('Could not reach the server')).toBeOnTheScreen();
  });

  it('shows nothing when not visible', async () => {
    await renderDialog({ visible: false });

    expect(screen.queryByText('Delete Vera?')).toBeNull();
  });
});
