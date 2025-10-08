const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  transform: {
    '^.+\\.(t|j)s?$': ['@swc/jest'],
  },
};
