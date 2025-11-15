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
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🔴 Error states for inline validation
  const [errors, setErrors] = useState({});

  // 🟢 Email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 🟢 Password strength validation
  const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);

  const validateFields = () => {
    let newErrors = {};

    if (!username.trim()) newErrors.username = "Username is required.";
    else if (username.length < 3)
      newErrors.username = "Username must be at least 3 characters.";

    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!isValidEmail(email)) newErrors.email = "Invalid email format.";

    if (!password) newErrors.password = "Password is required.";
    else if (!isStrongPassword(password))
      newErrors.password =
        "Min 6 chars, include uppercase, lowercase, and number.";

    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // true if no errors
  };

  const handleRegister = async () => {
    if (!validateFields()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username.trim(),
        email: email.trim(),
        role: "public",
        createdAt: new Date(),
      });

      navigation.replace("Login");
    } catch (error) {
      setErrors({
        firebase:
          error.message.includes("email-already-in-use")
            ? "This email is already registered."
            : error.message.includes("invalid-email")
            ? "Invalid email format."
            : error.message.includes("weak-password")
            ? "Weak password. Use at least 6 characters."
            : "Registration failed. Try again.",
      });
    }
  };

  const isButtonDisabled =
    !username || !email || !password || !confirmPassword;

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

          {/* Username */}
          <TextInput
            style={[
              styles.input,
              errors.username && styles.inputError,
            ]}
            placeholder="Username"
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors((prev) => ({ ...prev, username: null }));
            }}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          {/* Email */}
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: null }));
            }}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          {/* Password */}
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: null }));
            }}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Confirm Password */}
          <TextInput
            style={[
              styles.input,
              errors.confirmPassword && styles.inputError,
            ]}
            placeholder="Confirm Password"
            secureTextEntry
            placeholderTextColor="#6B7280"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Firebase error */}
          {errors.firebase && (
            <Text style={[styles.errorText, { marginTop: 10 }]}>
              {errors.firebase}
            </Text>
          )}

          {/* Register button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              isButtonDisabled && styles.disabledButton,
            ]}
            disabled={isButtonDisabled}
            onPress={handleRegister}
          >
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already have an account?
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              {" "}
              Login
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
    marginTop: 8,
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    width: "90%",
    maxWidth: 350,
    fontSize: 13,
    color: "#DC2626",
    marginTop: 2,
    marginBottom: 4,
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
  disabledButton: {
    backgroundColor: "#9CA3AF",
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
