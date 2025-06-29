const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for network requests
config.resolver.assetExts.push('cjs');

// Configure network settings
config.server = {
  ...config.server,
  port: 8081,
};

// Add network security headers
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config; 