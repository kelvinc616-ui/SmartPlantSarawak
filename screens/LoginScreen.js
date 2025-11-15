import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
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

  // ✅ Optional stronger password rule (letters + numbers)
  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    return strongRegex.test(password);
  };

  // 🔐 Handle login
  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // 1️⃣ Check empty fields
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    // 2️⃣ No spaces in email
    if (trimmedEmail.includes(" ")) {
      Alert.alert("Invalid Email", "Email cannot contain spaces.");
      return;
    }

    // 3️⃣ Validate email format
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // 4️⃣ Validate password length
    if (trimmedPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    // 5️⃣ Optional stronger password rule
    if (!isStrongPassword(trimmedPassword)) {
      Alert.alert(
        "Weak Password",
        "Password should contain at least 1 letter and 1 number."
      );
      return;
    }

    setLoading(true);

    try {
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword
      );

      const user = userCredential.user;

      // Fetch Firestore role
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        // Role-based navigation
        if (userData.role === "admin") {
          navigation.replace("AdminDashboard");
        } else {
          navigation.replace("Main");
        }
      } else {
        Alert.alert("Error", "User profile not found.");
      }
    } catch (error) {
      switch (error.code) {
        case "auth/invalid-email":
          Alert.alert("Login failed", "Invalid email format.");
          break;
        case "auth/user-not-found":
          Alert.alert("Login failed", "No user found with this email.");
          break;
        case "auth/wrong-password":
          Alert.alert("Login failed", "Incorrect password.");
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
        <Image
          source={require("../assets/Login_headerImage.jpg")}
          style={styles.headerImage}
        />

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
        <TouchableOpacity
          onPress={handleLogin}
          style={styles.loginButton}
          disabled={loading}
        >
          <Text style={styles.loginText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
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

/* 💅 Styles */
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
