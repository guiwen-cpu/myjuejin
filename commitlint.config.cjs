module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep commit messages concise.
    'header-max-length': [2, 'always', 150],
    'body-max-line-length': [2, 'always', 100],
  },
}