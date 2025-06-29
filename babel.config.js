module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add any additional plugins here
    ],
    env: {
      production: {
        plugins: [
          // Production-specific plugins
          'transform-remove-console',
        ],
      },
    },
  };
}; 