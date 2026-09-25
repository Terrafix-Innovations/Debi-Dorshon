import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import ScreenBackground from '../../components/common/ScreenBackground';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Allows web browser auth session to complete cleanly
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ navigation }) {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    googleClientId,
    googleAndroidClientId,
    googleIosClientId,
  } = useAuth();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Setup Google OAuth Request Hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId || undefined,
    webClientId: googleClientId || undefined,
    androidClientId: googleAndroidClientId || undefined,
    iosClientId: googleIosClientId || undefined,
    scopes: ['profile', 'email'],
    responseType: 'id_token',
  });

  // Handle Google OAuth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken || response.params?.id_token;
      const accessToken = response.authentication?.accessToken || response.params?.access_token;
      if (idToken || accessToken) {
        handleGoogleSuccess({ idToken, accessToken });
      }
    } else if (response?.type === 'error') {
      setErrorMessage(response.error?.message || 'Google sign-in was cancelled or failed.');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async ({ idToken, accessToken }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle({ idToken, accessToken });
      if (navigation) {
        navigation.navigate('MainTabs');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInPress = async () => {
    setErrorMessage(null);
    if (!googleClientId) {
      setErrorMessage('Google Sign-In is still connecting to the server. Please try again.');
      return;
    }
    setLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setErrorMessage('Could not open Google sign in window.');
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isLoginMode && cleanPassword !== confirmPassword.trim()) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        // Sign In
        await loginWithEmail(cleanEmail, cleanPassword);
      } else {
        // Sign Up
        await registerWithEmail(cleanEmail, cleanPassword, name.trim());
      }

      if (navigation) {
        navigation.navigate('MainTabs');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    if (navigation) {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryMaroon} />
      <ScreenBackground>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Tagline */}
            <View style={styles.headerBox}>
              <MaterialCommunityIcons name="flower-tulip" size={32} color={colors.goldHighlight} />
              <Text style={styles.headerTagline}>
                "Your ultimate companion for an unforgettable Pujo Parikrama."
              </Text>
            </View>

            {/* Branding Card */}
            <LinearGradient
              colors={[colors.primaryMaroon, colors.secondaryRed]}
              style={styles.brandCard}
            >
              <Text style={styles.brandTitle}>দেবী দর্শন</Text>
              <Text style={styles.brandSub}>আপনার পূজা পরিক্রমার সেরা সঙ্গী</Text>
              <View style={styles.brandBadge}>
                <MaterialCommunityIcons name="shield-check" size={14} color={colors.goldHighlight} />
                <Text style={styles.brandBadgeText}>Permanent Non-Expiring Login</Text>
              </View>
            </LinearGradient>

            {/* Auth Form Card */}
            <View style={styles.authWrap}>
              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Google One-Tap Button */}
              <TouchableOpacity
                style={[styles.googleBtn, loading && styles.btnDisabled]}
                onPress={handleGoogleSignInPress}
                disabled={loading}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="google" size={22} color="#DB4437" />
                <Text style={styles.googleBtnText}>
                  {isLoginMode ? 'Sign in with Google' : 'Sign up with Google'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign-Up Name Input */}
              {!isLoginMode && (
                <View style={styles.inputWrap}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.primaryMaroon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name (e.g. Subhashree)"
                    placeholderTextColor={`${colors.espresso}77`}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.primaryMaroon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={`${colors.espresso}77`}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.primaryMaroon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor={`${colors.espresso}77`}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={`${colors.espresso}88`}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password (Sign-Up only) */}
              {!isLoginMode && (
                <View style={styles.inputWrap}>
                  <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.primaryMaroon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={`${colors.espresso}77`}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                </View>
              )}

              {/* Primary Action Button */}
              <TouchableOpacity
                style={[styles.emailSubmitBtn, loading && styles.btnDisabled]}
                onPress={handleEmailAuthSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={isLoginMode ? 'login-variant' : 'account-plus'}
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.emailSubmitText}>
                      {isLoginMode ? 'Sign In to My Account' : 'Create Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Toggle Login/Signup */}
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => {
                  setIsLoginMode(!isLoginMode);
                  setErrorMessage(null);
                }}
                disabled={loading}
              >
                <Text style={styles.toggleText}>
                  {isLoginMode
                    ? "Don't have an account? Sign Up"
                    : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>

              {/* Guest Explore Option */}
              <View style={styles.guestRow}>
                <TouchableOpacity
                  style={styles.guestBtn}
                  onPress={handleGuestContinue}
                  disabled={loading}
                >
                  <MaterialCommunityIcons name="compass-outline" size={18} color={colors.primaryMaroon} />
                  <Text style={styles.guestBtnText}>Explore Puja Pandals as Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerTagline: {
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '600',
    color: colors.primaryMaroon,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  brandCard: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.goldHighlight,
    marginTop: 4,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  brandBadgeText: {
    color: colors.goldHighlight,
    fontSize: 11,
    fontWeight: '600',
  },
  authWrap: {
    width: '100%',
    backgroundColor: colors.cardCream,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    gap: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 4,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
    lineHeight: 16,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    gap: spacing.sm,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.espresso,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldMuted,
    opacity: 0.5,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 12,
    color: `${colors.espresso}99`,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.espresso,
  },
  emailSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMaroon,
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: 4,
    elevation: 2,
  },
  emailSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryMaroon,
    textAlign: 'center',
  },
  guestRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: `${colors.goldMuted}55`,
    paddingTop: 10,
    marginTop: 4,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryMaroon,
    textDecorationLine: 'underline',
  },
});
