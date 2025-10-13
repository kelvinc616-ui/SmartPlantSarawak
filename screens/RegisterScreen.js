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

  const handleRegister = async () => {
    if (!username.trim()) {
      alert("Please enter a username.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      //  Save extra data to Firestore (username, email, role)
      await setDoc(doc(db, "users", user.uid), {
        username: username.trim(),
        email: email.trim(),
        role: "public", // default role
        createdAt: new Date(),
      });

      alert("Registration successful!");
      navigation.replace("Login");
    } catch (error) {
      alert("Registration failed: " + error.message);
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

          {/* Username */}
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={setUsername}
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Confirm Password */}
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Register Button */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          {/* Back to Login */}
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
