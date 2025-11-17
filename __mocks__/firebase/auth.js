export const getAuth = jest.fn(() => ({
  currentUser: { uid: "test-user", email: "test@example.com" },
}));
