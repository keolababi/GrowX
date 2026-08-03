/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const vercelBlobDist = path.dirname(require.resolve('@vercel/blob/client'));

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');
const browserShims = {
  undici: path.join(vercelBlobDist, 'undici-browser.js'),
  crypto: path.join(vercelBlobDist, 'crypto-browser.js'),
  stream: path.join(vercelBlobDist, 'stream-browser.js'),
};
const vercelOidcShim = path.join(__dirname, 'shims/vercel-oidc.js');

const finalConfig = withNativeWind(config, { input: './global.css' });
const nativeWindResolveRequest = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@vercel/oidc') {
    return { filePath: vercelOidcShim, type: 'sourceFile' };
  }
  if (context.originModulePath.includes('@vercel/blob') && browserShims[moduleName]) {
    return { filePath: browserShims[moduleName], type: 'sourceFile' };
  }
  // Keep NativeWind's resolver in the chain. Calling Metro's resolver directly here
  // bypasses the virtual CSS module, leaving every className unstyled on web.
  return nativeWindResolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
