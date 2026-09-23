import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export default function AuthScreen({ navigation }) {
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthSubmit = () => {
    login({
      name: email ? email.split('@')[0] : 'Prianshu Mitra',
      email: email || 'prianshu@debidorshon.com',
    });
    if (navigation) {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryMaroon} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
        </LinearGradient>

        {/* Social & Email Auth Options */}
        <View style={styles.authWrap}>
          {/* Google Button */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleAuthSubmit}>
            <MaterialCommunityIcons name="google" size={22} color="#DB4437" />
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Facebook Button */}
          <TouchableOpacity style={styles.fbBtn} onPress={handleAuthSubmit}>
            <FontAwesome5 name="facebook" size={20} color={colors.white} />
            <Text style={styles.fbBtnText}>Continue with Facebook</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email & Password Input */}
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="email-outline" size={20} color={colors.primaryMaroon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={`${colors.espresso}77`}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.primaryMaroon} />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={`${colors.espresso}77`}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity style={styles.emailSubmitBtn} onPress={handleAuthSubmit}>
            <MaterialCommunityIcons name="email" size={20} color={colors.white} />
            <Text style={styles.emailSubmitText}>
              {isLoginMode ? 'Sign in with email' : 'Sign up with email'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsLoginMode(!isLoginMode)}
          >
            <Text style={styles.toggleText}>
              {isLoginMode
                ? "Don't have an account? Sign up"
                : 'Have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerTagline: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    color: colors.primaryMaroon,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  brandCard: {
    width: '100%',
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    marginTop: 6,
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
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.espresso,
  },
  fbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  fbBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldMuted,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 13,
    color: `${colors.espresso}88`,
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
    marginTop: spacing.xs,
  },
  emailSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryMaroon,
  },
});
