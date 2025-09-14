module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      "nativewind/babel",
    ],
    plugins: [
      "react-native-worklets/plugin", // Updated from react-native-reanimated/plugin
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};