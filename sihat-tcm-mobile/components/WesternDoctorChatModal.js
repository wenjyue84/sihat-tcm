import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { COLORS } from '../constants/themes';
import { API_CONFIG } from '../lib/apiConfig';
import { useTheme } from '../contexts/ThemeContext';
import { getSystemPrompt as fetchPrompt } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(API_CONFIG.GOOGLE_API_KEY);

// Western Doctor System Prompt
const getSystemPrompt = (reportData, language) => {
    const reportStr = reportData ? JSON.stringify(reportData, null, 2) : "No report data available.";
    const languageMap = {
        'zh': 'Chinese (Simplified)',
        'ms': 'Malay',
        'en': 'English'
    };
    const targetLang = languageMap[language] || 'English';

    return `You are Dr. Smith, a senior Western Medical Doctor (MD) with 20 years of experience in Internal Medicine and Integrative Health.
You respect Traditional Chinese Medicine (TCM) but your role is to provide a standardized, Evidence-Based Medicine (EBM) perspective on the patient's condition.

## USER'S TCM DIAGNOSIS REPORT:
${reportStr}

## YOUR ROLE:
1.  **Review the TCM Diagnosis**: Interpret the TCM patterns (e.g., "Liver Fire", "Spleen Qi Deficiency") into potential Western physiological equivalents (e.g., "Hypertension/Stress", "Digestive Enzyme Insufficiency").
2.  **Provide a "Second Opinion"**: Offer a western medical perspective on their symptoms.
3.  **Risk Assessment**: Identify any "Red Flags" or symptoms that require immediate standard medical attention (e.g., chest pain, severe headaches).
4.  **Suggest Standard Tests**: Recommend common lab tests (blood work, imaging) that would confirm the diagnosis in a Western hospital.
5.  **Lifestyle & Science**: Explain the "Why" behind lifestyle advice using anatomy and physiology.

## GUIDELINES:
-   **Tone**: Professional, clinical, precise, yet open-minded. Not mystical.
-   **Language**: Use clear medical terminology but explain it simply.
-   **Anatomy**: Reference specific organs and systems (Nervous, Circulatory, Endocrine).
-   **Safety**: If the TCM report misses a potentially dangerous condition, flag it immediately.
-   **Comparison**: Draw parallels between TCM findings and Western pathology.

IMPORTANT: You MUST respond in ${targetLang}.
`;
};


// Quick question suggestions
const getQuickQuestions = (t) => [
    t.westernChat?.questions?.opinion || "What is the Western medical view?",
    t.westernChat?.questions?.tests || "What lab tests should I take?",
    t.westernChat?.questions?.science || "Is there scientific backing for this?",
    t.westernChat?.questions?.redFlags || "Are there any warning signs?",
];

export default function WesternDoctorChatModal({ visible, onClose, reportData, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState(null);
    const [showSystemPrompt, setShowSystemPrompt] = useState(false);
    const scrollViewRef = useRef(null);

    const QUICK_QUESTIONS = useMemo(() => getQuickQuestions(t), [t]);

    // Initialize chat session when modal opens
    useEffect(() => {
        if (visible && !chatSession) {
            initializeChat();
        }
    }, [visible]);

    const initializeChat = async () => {
        try {
            // Fetch prompt
            const finalPrompt = getSystemPrompt(reportData, language);

            const model = genAI.getGenerativeModel({
                model: API_CONFIG.DEFAULT_MODEL,
                systemInstruction: finalPrompt,
            });

            const chat = model.startChat({
                history: [],
                generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
            });

            setChatSession(chat);

            // Add welcome message
            const introMsg = t.westernChat?.intro || "Hello. I am Dr. Smith. I have reviewed your TCM report. From a Western medical perspective, I can help translate these findings into physiological terms and suggest standard evaluations. How can I assist you?";

            setMessages([{
                id: 1,
                text: introMsg,
                isUser: false,
                timestamp: new Date(),
            }]);
        } catch (error) {
            console.error('Failed to initialize Western chat:', error);
            // Show error in chat if initialization fails
            setMessages([{
                id: Date.now(),
                text: t.westernChat?.error || "I apologize, but I'm having trouble starting the consultation.",
                isUser: false,
                isError: true,
                timestamp: new Date(),
            }]);
        }
    };


    const sendMessage = async (text) => {
        if (!text.trim() || isLoading || !chatSession) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userMessage = {
            id: Date.now(),
            text: text.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const aiMessageId = Date.now() + 1;
            let isFirstChunk = true;
            let fullText = '';

            const result = await chatSession.sendMessageStream(text.trim());

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;

                if (isFirstChunk) {
                    setIsLoading(false);
                    setMessages(prev => [...prev, {
                        id: aiMessageId,
                        text: fullText,
                        isUser: false,
                        timestamp: new Date(),
                    }]);
                    isFirstChunk = false;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, text: fullText }
                            : msg
                    ));
                }
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Chat error:', error);
            setIsLoading(false);
            const errorMessage = {
                id: Date.now() + 1,
                text: t.westernChat?.error || "I apologize, but I'm having trouble connecting at the moment.",
                isUser: false,
                isError: true,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Clinical Header - Blue Theme */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#0ea5e9', '#0284c7']} // Sky to Blue
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="medkit" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>{t.westernChat?.title || 'Western MD Opinion'}</Text>
                                <Text style={styles.headerSubtitle}>{t.westernChat?.subtitle || 'Evidence-Based Perspective'}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => setShowSystemPrompt(!showSystemPrompt)}
                                style={styles.iconButton}
                            >
                                <Ionicons name={showSystemPrompt ? "eye-off-outline" : "eye-outline"} size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                                <Ionicons name="close-circle" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* System Prompt View (For Verification/Debug) */}
                {showSystemPrompt && (
                    <View style={styles.promptContainer}>
                        <ScrollView style={styles.promptScroll}>
                            <Text style={styles.promptText}>{getSystemPrompt(reportData)}</Text>
                        </ScrollView>
                    </View>
                )}

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                msg.isUser ? styles.userBubble : styles.aiBubble,
                                msg.isError && styles.errorBubble,
                            ]}
                        >
                            {!msg.isUser && (
                                <View style={styles.aiAvatar}>
                                    <View style={styles.avatarInner}>
                                        <Text style={styles.aiAvatarText}>👨‍⚕️</Text>
                                    </View>
                                </View>
                            )}
                            <View style={[
                                styles.messageContent,
                                msg.isUser && styles.userMessageContent,
                                msg.isError && styles.errorMessageContent
                            ]}>
                                <Text style={[
                                    styles.messageText,
                                    msg.isUser && styles.userMessageText,
                                    msg.isError && styles.errorMessageText
                                ]}>
                                    {msg.text}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {isLoading && (
                        <View style={[styles.messageBubble, styles.aiBubble]}>
                            <View style={styles.aiAvatar}>
                                <View style={styles.avatarInner}>
                                    <ActivityIndicator size="small" color="#0284c7" />
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickQuestions}>
                        {QUICK_QUESTIONS.map((q, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.quickQuestionChip}
                                onPress={() => {
                                    setInputText(q);
                                    sendMessage(q);
                                }}
                            >
                                <Text style={styles.quickQuestionText}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t.westernChat?.placeholder || "Ask Dr. Smith..."}
                        placeholderTextColor="#94a3b8"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate-50 (Clinical white)
    },
    header: {
        height: Platform.OS === 'ios' ? 110 : 80,
        paddingTop: Platform.OS === 'ios' ? 40 : 10,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 4,
    },
    promptContainer: {
        height: 150,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    promptScroll: {
        padding: 16,
    },
    promptText: {
        color: '#94a3b8',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 11,
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: '#f1f5f9', // Slate-100
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 24,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    aiBubble: {
        alignSelf: 'flex-start',
    },
    aiAvatar: {
        width: 36,
        height: 36,
        marginRight: 8,
        justifyContent: 'flex-end',
    },
    avatarInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e0f2fe', // Sky-100
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    aiAvatarText: {
        fontSize: 20,
    },
    messageContent: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0', // Slate-200
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    userMessageContent: {
        backgroundColor: '#0284c7', // Sky-600
        borderTopLeftRadius: 16,
        borderTopRightRadius: 4,
        borderColor: '#0284c7',
    },
    messageText: {
        color: '#334155', // Slate-700
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#ffffff',
    },
    errorMessageContent: {
        backgroundColor: '#fef2f2',
        borderColor: '#fee2e2',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    errorMessageText: {
        color: '#b91c1c',
        fontSize: 14,
    },
    errorBubble: {
        maxWidth: '90%',
    },

    quickQuestions: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        maxHeight: 60,
    },
    quickQuestionChip: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    quickQuestionText: {
        color: '#0369a1',
        fontSize: 13,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 12,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#334155',
        fontSize: 15,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    sendButtonDisabled: {
        backgroundColor: '#e2e8f0',
        elevation: 0,
    },
});
