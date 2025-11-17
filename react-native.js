const RN = jest.requireActual("react-native");

module.exports = {
  ...RN,
  SafeAreaView: ({ children }) => <>{children}</>,
};
