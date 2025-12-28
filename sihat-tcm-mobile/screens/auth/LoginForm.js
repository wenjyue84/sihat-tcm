/**
 * LoginForm - Email/Password Login Component
 *
 * Handles the progressive disclosure auth flow:
 * - Email step: Enter email, check if user exists
 * - Password step: Enter password for existing users
 * - Signup step: Create new account for new users
 *
 * Features:
 * - Mock account bypass for development
 * - Guest session migration warning
 * - Automatic language matching
 * - Biometric authentication support
 *
 * @module screens/auth/LoginForm
 */

import React, { useState, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { supabase } from "../../lib/supabase";
import { API_CONFIG } from "../../lib/apiConfig";
import {
    getGuestSessionToken,
    clearGuestSessionToken,
} from "../../lib/guestSession";
import { FloatingLabelInput, GlassCard, COLORS, MOCKED_ACCOUNTS } from "./AuthComponents";

/**
 * LoginForm Component
 *
 * @param {Object} props - Component props
 * @param {string} props.language - Current UI language ('en', 'zh', 'ms')
 * @param {Function} props.onLoginSuccess - Called with user data on successful login
 * @param {Function} props.onGuestContinue - Called when user chooses guest mode
 * @param {Function} props.onBiometricAuth - Called to trigger biometric auth
 * @param {boolean} props.showBiometric - Whether to show biometric button
 * @param {Animated.Value} props.stepAnim - Animation value for step transitions
 */
export const LoginForm = ({
    language = "en",
    onLoginSuccess,
    onGuestContinue,
    onBiometricAuth,
    showBiometric = false,
    stepAnim,
}) => {
    // Progressive Disclosure: 'email' -> 'password' (existing user) or 'signup' (new user)
    const [authStep, setAuthStep] = useState("email"); // 'email' | 'password' | 'signup'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    // Validate email format
    const isValidEmail = useCallback((emailStr) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailStr);
    }, []);

    // Animate between auth steps
    const animateStepChange = (callback) => {
        if (stepAnim) {
            Animated.sequence([
                Animated.timing(stepAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(stepAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        setTimeout(callback, 150);
    };

    // Handle email continue - check if user exists
    const handleEmailContinue = async () => {
        if (!email.trim()) {
            Alert.alert(
                language === "zh" ? "提示" : language === "ms" ? "Perhatian" : "Notice",
                language === "zh"
                    ? "请输入邮箱地址"
                    : language === "ms"
                        ? "Sila masukkan alamat e-mel"
                        : "Please enter your email address"
            );
            return;
        }

        if (!isValidEmail(email.trim())) {
            Alert.alert(
                language === "zh" ? "无效邮箱" : language === "ms" ? "E-mel tidak sah" : "Invalid Email",
                language === "zh"
                    ? "请输入有效的邮箱地址"
                    : language === "ms"
                        ? "Sila masukkan alamat e-mel yang sah"
                        : "Please enter a valid email address"
            );
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setChecking(true);

        try {
            // Check for mock accounts first
            const mockUser = MOCKED_ACCOUNTS.find((acc) => acc.email === email.trim());
            if (mockUser) {
                animateStepChange(() => setAuthStep("password"));
                setChecking(false);
                return;
            }

            // Proceed to password step - if login fails, offer signup
            animateStepChange(() => setAuthStep("password"));
        } catch (error) {
            console.log("Email check error:", error);
            animateStepChange(() => setAuthStep("password"));
        } finally {
            setChecking(false);
        }
    };

    // Handle back to email step
    const handleBackToEmail = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        animateStepChange(() => {
            setAuthStep("email");
            setPassword("");
            setFullName("");
        });
    };

    // Perform sign in
    const performSignIn = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);

        try {
            // Check for Mock Account Bypass (Fast Testing)
            const mockUser = MOCKED_ACCOUNTS.find(
                (acc) => acc.email === email && acc.pass === password
            );
            if (mockUser) {
                await new Promise((resolve) => setTimeout(resolve, 600));
                const userData = {
                    id: `mock-${mockUser.role.toLowerCase()}`,
                    email: mockUser.email,
                    role: mockUser.role.toLowerCase(),
                };
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onLoginSuccess?.(userData);
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                // Check if user doesn't exist - offer to create account
                if (
                    error.message.includes("Invalid login credentials") ||
                    error.message.includes("Email not confirmed") ||
                    error.message.includes("User not found")
                ) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    Alert.alert(
                        language === "zh"
                            ? "账户未找到"
                            : language === "ms"
                                ? "Akaun Tidak Dijumpai"
                                : "Account Not Found",
                        language === "zh"
                            ? "该邮箱尚未注册，是否创建新账户？"
                            : language === "ms"
                                ? "E-mel ini belum didaftarkan. Buat akaun baharu?"
                                : "This email is not registered. Would you like to create an account?",
                        [
                            {
                                text: language === "zh" ? "取消" : language === "ms" ? "Batal" : "Cancel",
                                style: "cancel",
                            },
                            {
                                text:
                                    language === "zh"
                                        ? "创建账户"
                                        : language === "ms"
                                            ? "Buat Akaun"
                                            : "Create Account",
                                onPress: () => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    animateStepChange(() => setAuthStep("signup"));
                                },
                            },
                        ]
                    );
                } else {
                    throw error;
                }
                return;
            }

            // Successful login
            if (data?.user) {
                const userData = {
                    id: data.user.id,
                    email: data.user.email,
                    role: data.user.user_metadata?.role || "patient",
                };
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onLoginSuccess?.(userData);
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                language === "zh" ? "登录失败" : language === "ms" ? "Log Masuk Gagal" : "Login Failed",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle login attempt (check for guest session first)
    const handleLogin = async () => {
        if (loading) return;
        if (!password) {
            Alert.alert(
                language === "zh" ? "提示" : language === "ms" ? "Perhatian" : "Notice",
                language === "zh"
                    ? "请输入密码"
                    : language === "ms"
                        ? "Sila masukkan kata laluan"
                        : "Please enter your password"
            );
            return;
        }

        // Check for guest session token before signing in
        const guestToken = await getGuestSessionToken();
        if (guestToken) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
                language === "zh"
                    ? "诊断数据将不会被保存"
                    : language === "ms"
                        ? "Data Diagnosis Tidak Akan Disimpan"
                        : "Diagnosis Data Will Not Be Saved",
                language === "zh"
                    ? "您已作为访客完成了诊断。如果您现在登录，您的诊断数据将不会被保存到您的账户。"
                    : language === "ms"
                        ? "Anda telah menyelesaikan diagnosis sebagai tetamu. Jika anda log masuk sekarang, data diagnosis anda TIDAK akan disimpan."
                        : "You have completed a diagnosis as a guest. Your diagnosis data will NOT be saved to your account.",
                [
                    {
                        text: language === "zh" ? "取消" : language === "ms" ? "Batal" : "Cancel",
                        style: "cancel",
                    },
                    {
                        text:
                            language === "zh"
                                ? "我明白了"
                                : language === "ms"
                                    ? "Saya Faham"
                                    : "I Understand",
                        onPress: async () => {
                            await clearGuestSessionToken();
                            await performSignIn();
                        },
                    },
                ]
            );
            return;
        }

        await performSignIn();
    };

    // Handle signup
    const handleSignup = async () => {
        if (loading) return;
        if (!fullName.trim()) {
            Alert.alert(
                language === "zh" ? "提示" : language === "ms" ? "Perhatian" : "Notice",
                language === "zh"
                    ? "请输入您的姓名"
                    : language === "ms"
                        ? "Sila masukkan nama anda"
                        : "Please enter your name"
            );
            return;
        }
        if (!password || password.length < 6) {
            Alert.alert(
                language === "zh"
                    ? "密码太短"
                    : language === "ms"
                        ? "Kata laluan terlalu pendek"
                        : "Password Too Short",
                language === "zh"
                    ? "密码至少需要6个字符"
                    : language === "ms"
                        ? "Kata laluan mesti sekurang-kurangnya 6 aksara"
                        : "Password must be at least 6 characters"
            );
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);

        try {
            const {
                data: { user },
                error,
            } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        role: "patient",
                    },
                },
            });

            if (error) throw error;

            if (user) {
                await supabase.from("profiles").upsert({
                    id: user.id,
                    full_name: fullName.trim(),
                    role: "patient",
                });

                // Migrate guest session if exists
                const guestToken = await getGuestSessionToken();
                if (guestToken) {
                    try {
                        const {
                            data: { session },
                        } = await supabase.auth.getSession();
                        if (session?.access_token) {
                            const response = await fetch(
                                `${API_CONFIG.WEB_SERVER_URL}/api/migrate-guest-session`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({ sessionToken: guestToken }),
                                }
                            );

                            const result = await response.json();
                            if (result.success) {
                                await clearGuestSessionToken();
                                console.log("Guest diagnosis migrated successfully");
                            }
                        }
                    } catch (migrationError) {
                        console.warn("Error migrating guest session:", migrationError);
                    }
                }

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    language === "zh" ? "注册成功" : language === "ms" ? "Berjaya" : "Success",
                    language === "zh"
                        ? "账户创建成功！欢迎使用诗哈中医。"
                        : language === "ms"
                            ? "Akaun berjaya dibuat! Selamat datang ke Sihat TCM."
                            : "Account created! Welcome to Sihat TCM.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                const userData = {
                                    id: user.id,
                                    email: user.email,
                                    role: "patient",
                                };
                                onLoginSuccess?.(userData);
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                language === "zh"
                    ? "注册失败"
                    : language === "ms"
                        ? "Pendaftaran Gagal"
                        : "Signup Failed",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // Render email step
    const renderEmailStep = () => (
        <View>
            <FloatingLabelInput
                label={
                    language === "zh" ? "电子邮箱" : language === "ms" ? "Alamat E-mel" : "Email Address"
                }
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
            />

            <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEmailContinue}
                disabled={checking}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.amberStart, COLORS.amberEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                >
                    {checking ? (
                        <ActivityIndicator color={COLORS.emeraldDeep} />
                    ) : (
                        <Text style={styles.actionButtonText}>
                            {language === "zh" ? "继续" : language === "ms" ? "Teruskan" : "Continue"}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // Render password step
    const renderPasswordStep = () => (
        <View>
            {/* Email display with edit button */}
            <View style={styles.emailDisplayContainer}>
                <View style={styles.emailDisplayContent}>
                    <Ionicons name="mail" size={18} color={COLORS.amberStart} />
                    <Text style={styles.emailDisplayText} numberOfLines={1}>
                        {email}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleBackToEmail}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <FloatingLabelInput
                label={language === "zh" ? "密码" : language === "ms" ? "Kata Laluan" : "Password"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
                autoCapitalize="none"
            />

            <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.amberStart, COLORS.amberEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.emeraldDeep} />
                    ) : (
                        <Text style={styles.actionButtonText}>
                            {language === "zh" ? "登录" : language === "ms" ? "Log Masuk" : "Sign In"}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // Render signup step
    const renderSignupStep = () => (
        <View>
            {/* Email display with edit button */}
            <View style={styles.emailDisplayContainer}>
                <View style={styles.emailDisplayContent}>
                    <Ionicons name="mail" size={18} color={COLORS.amberStart} />
                    <Text style={styles.emailDisplayText} numberOfLines={1}>
                        {email}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleBackToEmail}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <FloatingLabelInput
                label={language === "zh" ? "全名" : language === "ms" ? "Nama Penuh" : "Full Name"}
                value={fullName}
                onChangeText={setFullName}
                icon="person-outline"
                autoCapitalize="words"
            />

            <FloatingLabelInput
                label={
                    language === "zh"
                        ? "创建密码"
                        : language === "ms"
                            ? "Cipta Kata Laluan"
                            : "Create Password"
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
                autoCapitalize="none"
            />

            <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[COLORS.amberStart, COLORS.amberEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.emeraldDeep} />
                    ) : (
                        <Text style={styles.actionButtonText}>
                            {language === "zh"
                                ? "创建账户"
                                : language === "ms"
                                    ? "Buat Akaun"
                                    : "Create Account"}
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <GlassCard>
            {authStep === "email" && renderEmailStep()}
            {authStep === "password" && renderPasswordStep()}
            {authStep === "signup" && renderSignupStep()}

            {/* Quick access section (only on email step when focused) */}
            {authStep === "email" && !isEmailFocused && (
                <View style={styles.quickAccessContainer}>
                    <Text style={styles.quickAccessLabel}>
                        {language === "zh"
                            ? "或使用以下方式登录"
                            : language === "ms"
                                ? "Atau log masuk dengan"
                                : "Or sign in with"}
                    </Text>

                    <View style={styles.socialRow}>
                        {/* Google Sign In */}
                        <TouchableOpacity style={[styles.socialButton, styles.socialButtonDisabled]}>
                            <Ionicons name="logo-google" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* Apple Sign In */}
                        <TouchableOpacity style={[styles.socialButton, styles.socialButtonDisabled]}>
                            <Ionicons name="logo-apple" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* Biometric Auth */}
                        {showBiometric && (
                            <TouchableOpacity style={styles.socialButton} onPress={onBiometricAuth}>
                                <MaterialCommunityIcons name="face-recognition" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Guest Mode */}
                    <TouchableOpacity style={styles.guestButton} onPress={onGuestContinue}>
                        <MaterialCommunityIcons
                            name="leaf"
                            size={16}
                            color={COLORS.amberStart}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.guestButtonText}>
                            {language === "en" && "Continue as Guest"}
                            {language === "zh" && "访客模式"}
                            {language === "ms" && "Teruskan sebagai Tetamu"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    actionButton: {
        marginTop: 10,
        shadowColor: COLORS.amberStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.emeraldDeep,
    },
    emailDisplayContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(251, 191, 36, 0.08)",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(251, 191, 36, 0.2)",
    },
    emailDisplayContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    emailDisplayText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "500",
        flex: 1,
    },
    quickAccessContainer: {
        alignItems: "center",
        width: "100%",
        marginTop: 20,
    },
    quickAccessLabel: {
        color: COLORS.textSecondary,
        marginBottom: 16,
        fontSize: 14,
    },
    socialRow: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 10,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    socialButtonDisabled: {
        opacity: 0.5,
    },
    guestButton: {
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.amberStart,
        backgroundColor: "rgba(251, 191, 36, 0.05)",
    },
    guestButtonText: {
        color: COLORS.amberStart,
        fontSize: 14,
        fontWeight: "600",
    },
});
