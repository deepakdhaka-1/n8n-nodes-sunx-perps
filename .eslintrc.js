module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'plugin:n8n-nodes-base/community',
  ],
  rules: {
    'n8n-nodes-base/node-param-display-name-miscased': 'error',
    'n8n-nodes-base/node-param-display-name-not-first-position': 'error',
    'n8n-nodes-base/node-param-description-miscased': 'error',
  },
};
