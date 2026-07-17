const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  ...compat.config({
    env: { browser: true, es2020: true },
    extends: ['airbnb', 'airbnb/hooks'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        alias: {
          map: [
            ['src', './src'],
            ['lucide-react', './src/shims/lucide-react.jsx'],
            ['react-router', './src/shims/react-router.jsx'],
          ],
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
  }),
  // Disable ESLint rules that conflict with Prettier
  prettierConfig,
  // Custom plugins and rules
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      perfectionist: require('eslint-plugin-perfectionist'),
      'unused-imports': require('eslint-plugin-unused-imports'),
      prettier: require('eslint-plugin-prettier'),
    },
    /**
     * 0 ~ 'off'
     * 1 ~ 'warn'
     * 2 ~ 'error'
     */
    rules: {
      'no-use-before-define': 0,
      'no-alert': 0,
      camelcase: 0,
      'no-console': 0,
      'no-unused-vars': 0,
      'no-nested-ternary': 0,
      'no-param-reassign': 0,
      'no-underscore-dangle': 0,
      'no-restricted-exports': 0,
      'no-promise-executor-return': 0,
      'import/prefer-default-export': 0,
      'prefer-destructuring': [1, { object: true, array: false }],
      // react
      'react/prop-types': 0,
      'react/no-children-prop': 0,
      'react/react-in-jsx-scope': 0,
      'react/no-array-index-key': 0,
      'react/require-default-props': 0,
      'react/jsx-props-no-spreading': 0,
      'react/function-component-definition': 0,
      'react/jsx-no-duplicate-props': [1, { ignoreCase: false }],
      'react/jsx-no-useless-fragment': [1, { allowExpressions: true }],
      'react/no-unstable-nested-components': [1, { allowAsProps: true }],
      // jsx-a11y
      'jsx-a11y/anchor-is-valid': 0,
      'jsx-a11y/control-has-associated-label': 0,
      // unused imports
      'unused-imports/no-unused-imports': 1,
      'unused-imports/no-unused-vars': [
        0,
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      // ensure Prettier formatting is enforced by ESLint (fixable via source.fixAll.eslint)
      'prettier/prettier': [1, { endOfLine: 'lf' }],
      // perfectionist
      'perfectionist/sort-exports': [1, { order: 'asc', type: 'line-length' }],
      'perfectionist/sort-named-imports': [1, { order: 'asc', type: 'line-length' }],
      'perfectionist/sort-named-exports': [1, { order: 'asc', type: 'line-length' }],
      'perfectionist/sort-imports': [
        1,
        {
          order: 'asc',
          type: 'line-length',
          newlinesBetween: 1,
          groups: [
            'style',
            'type',
            ['builtin', 'external'],
            'custom-mui',
            'custom-routes',
            'custom-hooks',
            'custom-utils',
            'internal',
            'custom-components',
            'custom-sections',
            'custom-auth',
            'custom-types',
            ['parent', 'sibling', 'index'],
            ['type-parent', 'type-sibling', 'type-index'],
            'unknown',
          ],
          customGroups: [
            { groupName: 'custom-mui', elementNamePattern: '^@mui/' },
            { groupName: 'custom-auth', elementNamePattern: '^src/auth/' },
            { groupName: 'custom-hooks', elementNamePattern: '^src/hooks/' },
            { groupName: 'custom-utils', elementNamePattern: '^src/utils/' },
            { groupName: 'custom-types', elementNamePattern: '^src/types/' },
            { groupName: 'custom-routes', elementNamePattern: '^src/routes/' },
            { groupName: 'custom-sections', elementNamePattern: '^src/sections/' },
            { groupName: 'custom-components', elementNamePattern: '^src/components/' },
          ],
          internalPattern: ['^src/'],
        },
      ],
    },
  },
  {
    files: ['src/app/dashboard/(modules)/procurement/_components/**/*.{js,jsx}'],
    rules: {
      'consistent-return': 0,
      'default-case': 0,
      'import/newline-after-import': 0,
      'import/no-extraneous-dependencies': 0,
      'import/order': 0,
      'jsx-a11y/click-events-have-key-events': 0,
      'jsx-a11y/label-has-associated-control': 0,
      'jsx-a11y/no-static-element-interactions': 0,
      'no-unused-expressions': 0,
      radix: 0,
      'react/button-has-type': 0,
      'react/no-unescaped-entities': 0,
      'react/self-closing-comp': 0,
    },
  },
];
