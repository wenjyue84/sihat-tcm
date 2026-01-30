/**
 * Jest Setup File
 * 
 * This file configures the test environment with necessary mocks
 * for React Native and Expo modules.
 */

// Mock React Native modules that don't work in the test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
    },
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: 'LinearGradient',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
    BlurView: 'BlurView',
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
    CameraView: 'CameraView',
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(() =>
        Promise.resolve({
            canceled: false,
            assets: [{ uri: 'mock-uri', base64: 'mock-base64' }],
        })
    ),
    MediaTypeOptions: {
        Images: 'Images',
        Videos: 'Videos',
        All: 'All',
    },
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
    isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
    authenticateAsync: jest.fn(() =>
        Promise.resolve({ success: true })
    ),
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
    },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
    MaterialCommunityIcons: 'MaterialCommunityIcons',
    MaterialIcons: 'MaterialIcons',
    FontAwesome: 'FontAwesome',
    FontAwesome5: 'FontAwesome5',
    Feather: 'Feather',
}));

// Mock Supabase client
jest.mock('./lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
        },
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                    data: [],
                    error: null,
                })),
                single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                data: [],
                error: null,
            })),
            insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
            update: jest.fn(() => Promise.resolve({ data: null, error: null })),
            delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
    },
}));

// Mock Google AI
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: jest.fn(() => ({
            generateContent: jest.fn(() =>
                Promise.resolve({
                    response: {
                        text: () => 'Mock AI response',
                    },
                })
            ),
        })),
    })),
}));

// Silence console warnings in tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test timeout (10 seconds)
jest.setTimeout(10000);
