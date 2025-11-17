export const auth = {
  currentUser: { uid: "test-user" },
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
};

export const db = {
  // Firestore mock
  collection: jest.fn(),
};

export const storage = {};

export default {};
