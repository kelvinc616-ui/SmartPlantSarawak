const React = require("react");
const { View } = require("react-native");

const createMockIcon = () => (props) => React.createElement(View, props);

module.exports = {
  Ionicons: createMockIcon(),
  MaterialIcons: createMockIcon(),
  AntDesign: createMockIcon(),
  FontAwesome: createMockIcon(),
};
