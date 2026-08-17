const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const isCI = process.env.CI === "1";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Keep generated CSS under the project root so Metro can watch and hash it
  // consistently in CI instead of racing on node_modules/react-native-css-interop/.cache.
  outputDir: ".nativewind",
  forceWriteFileSystem: !isCI,
});

