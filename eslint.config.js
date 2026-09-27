// @ts-check
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['src/**/*.ts'],
  extends: [tseslint.configs.base],
  plugins: { '@stylistic': stylistic },
  rules: {
    '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
  },
});
