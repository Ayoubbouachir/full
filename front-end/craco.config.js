module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix: face-api.js essaie d'importer 'fs' (module Node.js) dans le browser
      // On dit à webpack de l'ignorer avec false
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      return webpackConfig;
    },
  },
};
