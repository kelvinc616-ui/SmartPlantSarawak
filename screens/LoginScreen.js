import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
  Image,
  StatusBar,
} from "react-native";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in.",
          [
            {
              text: "Resend Verification Link",
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert("Verification Sent", "Check your inbox.");
                } catch (error) {
                  console.error(error);
                  Alert.alert("Error", "Could not resend verification email.");
                }
              },
            },
            { text: "OK", style: "cancel" },
          ]
        );
        return;
      }

      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.role === "admin") {
          navigation.replace("AdminMain");
        } else if (userData.role === "public") {
          navigation.replace("UserMain");
        } else {
          Alert.alert("Error", "Unknown role assigned.");
        }
      } else {
        Alert.alert("Error", "User profile not found in Firestore.");
      }
    } catch (error) {
      console.error("Login failed:", error.message);
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={
        require("../assets/images/loginpagebg2.jpg")
      }
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Continue your journey in protecting Sarawak’s biodiversity.
        </Text>

        {/* Input Fields */}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#D9F3E2"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#D9F3E2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.button, loading && { opacity: 0.8 }]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "LOGIN"}
          </Text>
        </TouchableOpacity>

        {/* Register Link */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.signupText}>
            Don’t have an account?{" "}
            <Text style={{ color: "#C8FACC", fontWeight: "700" }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  container: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: 24,
    paddingTop: 75,
  },
  title: {
  fontSize: 30,
  color: "#E6F8EC",
  fontWeight: "700",
  marginBottom: 6,
  },
  subtitle: {
  color: "#C8FACC",
  fontSize: 15,
  textAlign: "center",
  marginBottom: 28,
  paddingHorizontal: 12,
  opacity: 0.9,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    width: "100%",
    backgroundColor: "#5BA87D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  buttonText: {
    color: "#F2FFF7",
    fontWeight: "700",
    fontSize: 16,
  },
  signupText: {
    fontSize: 14,
    color: "#D9F3E2",
    marginTop: 18,
  },
});
