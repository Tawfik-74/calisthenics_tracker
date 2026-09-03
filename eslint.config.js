import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

const FEATURES = ['auth', 'plan', 'workouts', 'social', 'stats'];

// A feature may import another feature ONLY through its index.ts barrel.
// `except` is relative to `from`, and is what makes the barrel the contract —
// a bare glob like `!(index.ts)` only matches direct children and would let
// `features/workouts/model/sessionStore` slip through.
const crossFeatureZones = FEATURES.flatMap((target) =>
  FEATURES.filter((from) => from !== target).map((from) => ({
    target: `./src/features/${target}`,
    from: `./src/features/${from}`,
    except: ['./index.ts'],
    message: `Import '${from}' only through its index.ts barrel.`,
  })),
);

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'supabase/functions'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // app -> features -> shared. Never sideways.
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/shared',
              from: './src/features',
              message: 'shared cannot depend on features',
            },
            {
              target: './src/shared',
              from: './src/app',
              message: 'shared cannot depend on app',
            },
            {
              target: './src/features',
              from: './src/app',
              message: 'features cannot depend on app',
            },
            ...crossFeatureZones,
          ],
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
  },
);
