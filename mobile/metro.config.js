/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const vercelBlobDist = path.dirname(require.resolve('@vercel/blob/client'));

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.resolverMainFields = config.resolver.resolverMainFields.filter(
  (field) => field !== 'browser',
);
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');
const browserShims = {
  undici: path.join(vercelBlobDist, 'undici-browser.js'),
  crypto: path.join(vercelBlobDist, 'crypto-browser.js'),
  stream: path.join(vercelBlobDist, 'stream-browser.js'),
};

const finalConfig = withNativeWind(config, { input: './global.css' });
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (context.originModulePath.includes('@vercel/blob') && browserShims[moduleName]) {
    return { filePath: browserShims[moduleName], type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
