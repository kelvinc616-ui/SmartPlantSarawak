process.env.EXPO_USE_EXPERIMENTAL_WINTER = "false";

// Disable Expo "Winter" Web runtime
global.window = undefined;
global.document = undefined;