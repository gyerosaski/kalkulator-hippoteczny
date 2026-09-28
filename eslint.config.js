// @ts-check
import stylistic from '@stylistic/eslint-plugin';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'out-tsc/', 'coverage/', '.angular/', 'public/', 'src-tauri/'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked, ...angular.configs.tsRecommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true },
      ],
      // Statyczne walidatory Angulara (`Validators.required`, `Validators.min(…)`) nie korzystają
      // z `this`, a reguła nie ma listy wyjątków — każde przekazanie walidatora byłoby fałszywym alarmem.
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
