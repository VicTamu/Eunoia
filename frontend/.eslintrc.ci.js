module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'prettier/prettier': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
