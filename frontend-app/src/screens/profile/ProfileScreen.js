import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import HeaderNavbar from '../../components/common/HeaderNavbar';
import SideDrawer from '../../components/common/SideDrawer';
import ScreenBackground from '../../components/common/ScreenBackground';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

// Allows web browser auth session to complete cleanly
WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen({ navigation }) {
  const {
    user,
    logout,
    isAuthenticated,
    googleClientId,
    googleAndroidClientId,
    googleIosClientId,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
  } = useAuth();

  // Authentication UI state (when not signed in)
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      setAuthLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async ({ idToken, accessToken }) => {
    setAuthLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle({ idToken, accessToken });
    } catch (err) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignInPress = async () => {
    setErrorMessage(null);
    setAuthLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setErrorMessage(err.message || 'Could not launch Google Sign-In.');
      setAuthLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
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

    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        await registerWithEmail(cleanEmail, cleanPassword, name.trim());
      } else {
        await loginWithEmail(cleanEmail, cleanPassword);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderNavbar navigation={navigation} title="Profile • দেবী দর্শন" />
      <SideDrawer navigation={navigation} />

      <ScreenBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isAuthenticated ? (
            /* ==================== SIGNED IN STATE (MINIMAL & ON POINT) ==================== */
            <View style={styles.signedInWrap}>
              {/* User Profile Card */}
              <LinearGradient
                colors={[colors.primaryMaroon, colors.secondaryRed]}
                style={styles.profileCard}
              >
                <View style={styles.userRow}>
                  <View style={styles.avatarBorder}>
                    {user?.picture ? (
                      <Image source={{ uri: user.picture }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarInner}>
                        {user?.name ? (
                          <Text style={styles.avatarLetter}>
                            {user.name.charAt(0).toUpperCase()}
                          </Text>
                        ) : (
                          <Ionicons name="person" size={28} color={colors.primaryMaroon} />
                        )}
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user?.name || 'Puja Pilgrim'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user?.email || ''}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Minimal Essential Actions */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Trip')}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconWrap}>
                    <MaterialCommunityIcons name="routes" size={22} color={colors.primaryMaroon} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Saved Routes & Trips</Text>
                    <Text style={styles.actionSub}>View your planned Durga Puja routes</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={`${colors.espresso}88`} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Stations')}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconWrap}>
                    <MaterialCommunityIcons name="heart-outline" size={22} color={colors.primaryMaroon} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Favorite Pandals</Text>
                    <Text style={styles.actionSub}>Your shortlisted pandals & transit stops</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={`${colors.espresso}88`} />
                </TouchableOpacity>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="logout" size={20} color={colors.secondaryRed} />
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ==================== SIGN IN STATE (VERY MINIMAL & ON POINT) ==================== */
            <View style={styles.guestCardWrap}>
              <View style={styles.signInCard}>
                {/* Clean Emblem Icon */}
                <View style={styles.emblemCircle}>
                  <MaterialCommunityIcons name="account-circle-outline" size={52} color={colors.primaryMaroon} />
                </View>

                <Text style={styles.signInTitle}>Sign In</Text>
                <Text style={styles.signInSub}>
                  Sign in with Google to sync your saved pandals and custom routes.
                </Text>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#D32F2F" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Prominent Google Sign-In Button */}
                <TouchableOpacity
                  style={[styles.googleSignInBtn, authLoading && styles.btnDisabled]}
                  onPress={handleGoogleSignInPress}
                  disabled={authLoading}
                  activeOpacity={0.85}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color={colors.primaryMaroon} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                      <Text style={styles.googleSignInBtnText}>Sign in with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Minimal Email Alternative Toggle */}
                {!showEmailForm ? (
                  <TouchableOpacity
                    style={styles.emailToggleBtn}
                    onPress={() => setShowEmailForm(true)}
                  >
                    <Text style={styles.emailToggleText}>or sign in with email</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emailFormWrap}>
                    <View style={styles.dividerLine} />

                    {isRegisterMode && (
                      <View style={styles.inputWrap}>
                        <MaterialCommunityIcons name="account-outline" size={20} color={colors.primaryMaroon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Your Name"
                          placeholderTextColor={`${colors.espresso}77`}
                          value={name}
                          onChangeText={setName}
                          editable={!authLoading}
                        />
                      </View>
                    )}

                    <View style={styles.inputWrap}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={colors.primaryMaroon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor={`${colors.espresso}77`}
                        value={email}
                        onChangeText={(val) => {
                          setEmail(val);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!authLoading}
                      />
                    </View>

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
                        secureTextEntry
                        editable={!authLoading}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.emailSubmitBtn, authLoading && styles.btnDisabled]}
                      onPress={handleEmailSubmit}
                      disabled={authLoading}
                      activeOpacity={0.85}
                    >
                      {authLoading ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.emailSubmitText}>
                          {isRegisterMode ? 'Create Account' : 'Sign In'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modeToggleBtn}
                      onPress={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setErrorMessage(null);
                      }}
                    >
                      <Text style={styles.modeToggleText}>
                        {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  /* Signed-In State */
  signedInWrap: {
    gap: spacing.md,
  },
  profileCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 3,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.goldHighlight,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardCream,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardCream,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryMaroon,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
  },
  actionSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(139, 26, 26, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.espresso,
  },
  actionSub: {
    fontSize: 12,
    color: `${colors.espresso}99`,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondaryRed,
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  signOutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondaryRed,
  },

  /* Guest / Sign-In State */
  guestCardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  signInCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    padding: spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  emblemCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 26, 26, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  signInTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryMaroon,
    marginBottom: spacing.xs,
  },
  signInSub: {
    fontSize: 13,
    color: colors.espresso,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 8,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
  },
  googleSignInBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  googleSignInBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.espresso,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  emailToggleBtn: {
    paddingVertical: 12,
    marginTop: spacing.xs,
  },
  emailToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryMaroon,
    textDecorationLine: 'underline',
  },
  emailFormWrap: {
    width: '100%',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.goldMuted,
    opacity: 0.4,
    marginVertical: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.goldMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 46,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.espresso,
  },
  emailSubmitBtn: {
    backgroundColor: colors.primaryMaroon,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emailSubmitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  modeToggleBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeToggleText: {
    fontSize: 12,
    color: colors.primaryMaroon,
    fontWeight: '600',
  },
});
