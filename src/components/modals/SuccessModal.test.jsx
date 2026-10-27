import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import SuccessModal from './SuccessModal';

test('renders a Paragon 23 dialog and handles closing it', () => {
  const onClose = jest.fn();
  render(
    <IntlProvider locale="en" messages={{}}>
      <SuccessModal
        intl={{ formatMessage: ({ defaultMessage }) => defaultMessage }}
        isOpen
        message="Subscription updated"
        onClose={onClose}
      />
    </IntlProvider>,
  );
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Subscription updated')).toBeInTheDocument();
  const closeButtons = screen.getAllByRole('button', { name: 'Close' });
  expect(closeButtons).toHaveLength(2);
  closeButtons.forEach(button => fireEvent.click(button));
  expect(onClose).toHaveBeenCalledTimes(2);
});
