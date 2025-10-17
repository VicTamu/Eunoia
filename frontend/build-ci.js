process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false'; // Override CI to prevent treating warnings as errors
require('react-scripts/scripts/build');
