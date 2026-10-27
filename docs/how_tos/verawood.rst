Verawood migration
##################

Upstream baseline
*****************

This application follows the standalone MFE architecture used by the
``release/verawood`` branches of `account`_ and `learning`_. It uses React 18,
frontend-platform 8.7, frontend-build 14.6, header 8.2, footer 14.6, plugin
framework 1.7 and Paragon 23.4. Node 24 is selected by ``.nvmrc`` and CI.
The lockfile records the exact installed versions; use ``npm ci``.

Compared with this application's Ulmo dependencies, Paragon moves from 22 to
23 and the header from 6 to 8. The upstream Ulmo release branch already has
Paragon 23 updates, so the release names alone do not describe token support.
The footer now exports FooterSlot itself; the separate frontend-slot-footer
package is no longer needed. The existing ``footer_slot`` identifier remains.

.. _account: https://github.com/openedx/frontend-app-account/blob/release/verawood/package.json
.. _learning: https://github.com/openedx/frontend-app-learning/blob/release/verawood/package.json

Theming
*******

Paragon 23 uses CSS custom properties. ``src/index.scss`` must not import the
old brand variables/overrides or Paragon core Sass. AppProvider loads core and
variant CSS through frontend-platform; frontend-build includes the installed
Paragon and brand CSS assets as local defaults and fallbacks.

Operators can set ``PARAGON_THEME_URLS`` through the MFE configuration API or
``env.config.jsx`` to serve shared CSS and brand overrides. Use token-compatible
brand assets and keep their Paragon version aligned with the app. Existing
Sass-only brand customizations need conversion. Custom component colors now
use semantic ``--pgn-color-*`` variables, so their appearance follows the
configured theme, including status colors and light surfaces. Orange/purple
accents follow the theme's accent-a/accent-b values.

See the `frontend-platform theming guide`_ for the URL schema and fallbacks.
The old ``start:with-theme`` script has been removed; use ``npm start`` with
runtime theme configuration instead.

.. _frontend-platform theming guide: https://github.com/openedx/frontend-platform/blob/master/docs/how_tos/theming.md

Frontend-base decision
**********************

Verawood introduces frontend-base alongside existing standalone MFEs.
According to the `Verawood release notes`_, the authn and learner-dashboard
frontend-base replacements are disabled by default. Sabelity remains a
standalone MFE, preserving its Tutor build, URLs, platform authentication,
configuration API and plugin configuration.

Installing frontend-base alongside frontend-platform would not convert this
application. A conversion needs a published App package registered in a site
config, shell-owned routing and header/footer, app-scoped configuration and
providers, and replacement of platform auth/config/i18n imports. React,
Paragon and frontend-base become shared peer dependencies. Its deployment
must move from the standalone MFE image to the composing site's workspace.
Follow the `frontend-base porting guide`_ when making that deployment change.

.. _Verawood release notes: https://docs.openedx.org/en/release-verawood/community/release_notes/verawood/dev_op_release_notes.html
.. _frontend-base porting guide: https://docs.openedx.org/en/release-verawood/site_ops/how-tos/port-frontend-plugin-to-frontend-base.html

Verification
************

Run ``nvm use``, ``npm ci``, ``npm test -- --runInBand`` and ``npm run build``.
Run ``npm run lint`` as well; the application had substantial existing lint
debt before this migration. On a Verawood Tutor instance, smoke-test login,
the header/footer, profile and billing routes, cart dialogs and theme loading
with both the installed default CSS and the operator's configured theme URLs.
Payment flows require the deployment's backend and Stripe configuration.
