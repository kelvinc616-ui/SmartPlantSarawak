import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

const handleRegister = async () => {
  if (!username.trim()) {
    Alert.alert("Missing field", "Please enter a username.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Password mismatch", "Passwords do not match!");
    return;
  }

  // ✅ Password validation
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    Alert.alert(
      "Weak Password",
      "Password must be at least 8 characters long, and include at least one letter, one number, and one special character."
    );
    return;
  }

  try {
    setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user);

    // Save extra user data
    await setDoc(doc(db, "users", user.uid), {
      username: username.trim(),
      email: email.trim(),
      role: "public",
      createdAt: new Date(),
    });

    Alert.alert("Success", "Check your email to verify your account.");
    navigation.replace("Login");
  } catch (error) {
    Alert.alert("Registration failed", error.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <ImageBackground
      source={require("../assets/images/loginpagebg2.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>
              Join us in preserving Sarawak’s biodiversity.
            </Text>

            {/* Username */}
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#D9F3E2"
              value={username}
              onChangeText={setUsername}
            />

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#D9F3E2"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            {/* Password */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#D9F3E2"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Confirm Password */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#D9F3E2"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.8 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Registering..." : "REGISTER"}
              </Text>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text style={{ color: "#C8FACC", fontWeight: "700" }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
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
  footerText: {
    fontSize: 14,
    color: "#D9F3E2",
    marginTop: 18,
  },
});
