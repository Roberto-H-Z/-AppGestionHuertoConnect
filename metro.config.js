const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const finalConfig = withNativeWind(config, { input: "./global.css" });
const workletsEntry = path.resolve(
  __dirname,
  "node_modules/react-native-worklets/lib/module/index.js"
);
const workletsRoot = path.resolve(__dirname, "node_modules/react-native-worklets");
const defaultResolveRequest = finalConfig.resolver.resolveRequest;

finalConfig.resolver.extraNodeModules = {
  ...(finalConfig.resolver.extraNodeModules || {}),
  "react-native-worklets": workletsRoot,
};

finalConfig.watchFolders = [...(finalConfig.watchFolders || []), workletsRoot];

finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-worklets") {
    return {
      filePath: workletsEntry,
      type: "sourceFile",
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
