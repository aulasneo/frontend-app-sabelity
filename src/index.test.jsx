/* eslint-disable react/prop-types -- Test doubles only implement the props under test. */
import { act } from 'react';
import { screen } from '@testing-library/react';
import {
  APP_READY, APP_INIT_ERROR, subscribe, initialize,
} from '@edx/frontend-platform';
import { createRoot } from 'react-dom/client';

jest.mock('@edx/frontend-platform', () => ({
  APP_READY: 'ready',
  APP_INIT_ERROR: 'error',
  subscribe: jest.fn(),
  initialize: jest.fn(),
  getConfig: () => ({ FAVICON_URL: '/favicon.ico' }),
}));
jest.mock('react-dom/client', () => {
  const actual = jest.requireActual('react-dom/client');
  return { ...actual, createRoot: jest.fn(actual.createRoot) };
});
jest.mock('@edx/frontend-platform/react', () => ({
  AppProvider: ({ children }) => children,
  ErrorPage: ({ message }) => <div role="alert">{message}</div>,
}));
jest.mock('@edx/frontend-component-header', () => function MockHeader() {
  return <header>Header</header>;
});
jest.mock('@edx/frontend-component-footer', () => ({
  FooterSlot: () => <footer>Footer slot</footer>,
}));
jest.mock('./RoutesPages', () => function MockRoutes() {
  return <main>Subscription routes</main>;
});
jest.mock('./contexts/SubscriptionsContext', () => ({
  SubscriptionsProvider: ({ children }) => children,
}));
jest.mock('./contexts/BillingContext', () => ({
  BillingProvider: ({ children }) => children,
}));

test('renders the application and initialization errors using the same React root', () => {
  document.body.innerHTML = '<div id="root"></div>';
  // Load the entry point after the root element exists.
  jest.requireActual('./index');
  const handlers = Object.fromEntries(subscribe.mock.calls);

  expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ messages: expect.any(Object) }));
  act(() => handlers[APP_READY]());
  expect(screen.getByRole('banner')).toHaveTextContent('Header');
  expect(screen.getByRole('main')).toHaveTextContent('Subscription routes');
  expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer slot');

  act(() => handlers[APP_INIT_ERROR](new Error('Initialization failed')));
  expect(screen.getByRole('alert')).toHaveTextContent('Initialization failed');
  expect(createRoot).toHaveBeenCalledTimes(1);
  act(() => createRoot.mock.results[0].value.unmount());
});
