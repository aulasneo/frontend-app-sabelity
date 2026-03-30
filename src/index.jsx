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
import FooterSlot from '@openedx/frontend-slot-footer';
import messages from './i18n';

import './index.scss';
import RoutesPages from './RoutesPages';

subscribe(APP_READY, () => {
  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <AppProvider>
        <Helmet>
          <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
        </Helmet>
        <Header />
        <RoutesPages />
        <FooterSlot />
      </AppProvider>
    </StrictMode>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  const root = createRoot(document.getElementById('root'));

  root.render(
    <StrictMode>
      <ErrorPage message={error.message} />
    </StrictMode>,
  );
});

initialize({
  messages,
});
