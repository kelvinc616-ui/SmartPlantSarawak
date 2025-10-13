// 🔹 Import core Firebase SDKs for React Native
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔹 Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmeBhVhI8IsgHT-4vbhNaPuaIpalLSVck",
  authDomain: "smartplantsarawak-f13b9.firebaseapp.com",
  projectId: "smartplantsarawak-f13b9",
  storageBucket: "smartplantsarawak-f13b9.appspot.com", // ✅ fixed here
  messagingSenderId: "615502932033",
  appId: "1:615502932033:web:f27f14361319e5e103bec0",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Initialize Firebase Authentication with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// 🔹 Initialize Firestore Database
export const db = getFirestore(app);

// 🔹 Initialize Firebase Storage
export const storage = getStorage(app);
