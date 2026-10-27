import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, getConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Helmet } from 'react-helmet';

import Header from '@edx/frontend-component-header';
import { FooterSlot } from '@edx/frontend-component-footer';
import messages from './i18n';

import './index.scss';
import RoutesPages from './RoutesPages';
import { SubscriptionsProvider } from './contexts/SubscriptionsContext';
import { BillingProvider } from './contexts/BillingContext';

const root = createRoot(document.getElementById('root'));

subscribe(APP_READY, () => {
  root.render(
    <StrictMode>
      <AppProvider>
        <Helmet>
          <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
        </Helmet>
        <Header />
        <SubscriptionsProvider>
          <BillingProvider>
            <RoutesPages />
          </BillingProvider>
        </SubscriptionsProvider>
        <FooterSlot />
      </AppProvider>
    </StrictMode>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  root.render(
    <StrictMode>
      <ErrorPage message={error.message} />
    </StrictMode>,
  );
});

initialize({
  messages,
});
