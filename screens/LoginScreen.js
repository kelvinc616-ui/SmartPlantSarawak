import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Basic email format validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 🔐 Handle login
  const handleLogin = async () => {
    // 1️⃣ Check for empty fields
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    // 2️⃣ Validate email format
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g., example@gmail.com).");
      return;
    }

    // 3️⃣ Validate password length
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // 4️⃣ Sign in user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 5️⃣ Fetch Firestore profile document
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log("✅ Logged in as:", userData);

        // 6️⃣ Role-based navigation
        if (userData.role === "admin") {
          navigation.replace("AdminDashboard");
        } else {
          navigation.replace("Main");
        }
      } else {
        Alert.alert("Error", "User profile not found in Firestore.");
      }
    } catch (error) {
      console.error("❌ Login failed:", error.message);

      // 7️⃣ Friendlier Firebase error handling
      switch (error.code) {
        case "auth/invalid-email":
          Alert.alert("Login failed", "Invalid email format.");
          break;
        case "auth/user-not-found":
          Alert.alert("Login failed", "No user found with this email.");
          break;
        case "auth/wrong-password":
          Alert.alert("Login failed", "Incorrect password. Please try again.");
          break;
        default:
          Alert.alert("Login failed", error.message);
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 🌿 Header Image */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1d9xszeE3ZENEvgyeJW8FqzLqCnb3HnQnilj6tQYG_cYz6Y5M6sxjU37ptb66WqYdod_nfoqF4bYB__LvT0102wrzs9HQ9HPOQnwuTo-NjMPv-9c5npu9mhhD0iF4cGN_jCplk0mIZyYbgy4chowe55UMODx4l2gL9bAvTHNZFXsvXwaDw0htkK6XjGpSfe9655gMoN09D19-ij9UMugIlsmwDzBJogu7y8epMDD63AXVm7tzpHpIfV18lZohzf5TEaK7CmwPv70",
          }}
          style={styles.headerImage}
        />

        {/* 👋 Welcome Text */}
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Log in to continue your journey in protecting Sarawak’s biodiversity.
        </Text>

        {/* 📧 Email Input */}
        <TextInput
          placeholder="Email Address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* 🔒 Password Input */}
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* 🔘 Login Button */}
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton} disabled={loading}>
          <Text style={styles.loginText}>{loading ? "Logging in..." : "Login"}</Text>
        </TouchableOpacity>

        {/* 🆕 Register Link */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.signupText}>
            Don’t have an account?{" "}
            <Text style={{ color: "#2E7D32", fontWeight: "700" }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A202C",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginVertical: 10,
  },
  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#1A202C",
    marginVertical: 8,
  },
  loginButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  loginText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  signupText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 16,
  },
});
