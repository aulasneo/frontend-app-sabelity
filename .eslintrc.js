// eslint-disable-next-line import/no-extraneous-dependencies
const { createConfig } = require('@openedx/frontend-build');

const config = createConfig('eslint', {
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
      },
    },
  },
});

delete config.settings['import/resolver'].typescript;

module.exports = config;
