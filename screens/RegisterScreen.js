import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert, // ✅ Added Alert for clearer feedback
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ Helper function to check if email is in valid format
  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // ✅ Helper function for password strength
  const isStrongPassword = (password) => {
    // Minimum 6 chars, one uppercase, one lowercase, one number
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return pattern.test(password);
  };

  const handleRegister = async () => {
    // 🟢 1. Check for empty fields
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all the fields.");
      return;
    }

    // 🟢 2. Validate username
    if (username.length < 3) {
      Alert.alert("Invalid Username", "Username must be at least 3 characters long.");
      return;
    }

    // 🟢 3. Validate email format
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // 🟢 4. Validate password strength
    if (!isStrongPassword(password)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    // 🟢 5. Confirm password check
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match!");
      return;
    }

    try {
      // 🟢 6. Create account with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🟢 7. Save user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username.trim(),
        email: email.trim(),
        role: "public", // default role
        createdAt: new Date(),
      });

      Alert.alert("Success", "Registration successful!");
      navigation.replace("Login");
    } catch (error) {
      // 🟢 8. Catch Firebase registration errors
      let message = error.message;

      if (message.includes("email-already-in-use")) {
        message = "This email is already registered.";
      } else if (message.includes("invalid-email")) {
        message = "The email format is invalid.";
      } else if (message.includes("weak-password")) {
        message = "Password should be at least 6 characters.";
      }

      Alert.alert("Registration Failed", message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subtitle}>
            Join SmartPlant Sarawak and help protect our biodiversity.
          </Text>

          {/* 🟢 Username Input */}
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={setUsername}
          />

          {/* 🟢 Email Input */}
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* 🟢 Password Input */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* 🟢 Confirm Password Input */}
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* 🟢 Register Button */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          {/* 🟢 Back to Login */}
          <Text style={styles.footerText}>
            Already have an account?
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              {" "}Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F7F8FA",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "90%",
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1A202C",
    marginVertical: 8,
  },
  registerButton: {
    width: "90%",
    maxWidth: 350,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  registerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 20,
  },
  loginLink: {
    color: "#2E7D32",
    fontWeight: "600",
  },
});
