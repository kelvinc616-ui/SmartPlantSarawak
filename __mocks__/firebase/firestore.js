export const collection = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const orderBy = jest.fn();
export const limit = jest.fn();

export const getDocs = jest.fn(() =>
  Promise.resolve({
    docs: [],
  })
);

// Firestore doc snapshot helper for EditProfileScreen
export const doc = jest.fn();
export const getDoc = jest.fn();
export const updateDoc = jest.fn();
