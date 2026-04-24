'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, messageFromUnknown } from '@/contexts/AuthContext';

type GoogleIdInitializeConfig = {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
};

type GoogleIdRenderButtonConfig = {
    type?: string;
    theme?: string;
    size?: string;
    text?: string;
    width?: number;
};

interface GoogleCredentialResponse {
    credential: string;
    select_by?: string;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleIdInitializeConfig) => void;
                    renderButton: (element: HTMLElement, config: GoogleIdRenderButtonConfig) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleSignInProps {
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    width?: number;
}

export default function GoogleSignIn({ 
    text = 'signin_with', 
    theme = 'outline',
    size = 'large',
    width
}: GoogleSignInProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { loginWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
        try {
            setError(null);
            await loginWithGoogle(response.credential);
            router.push('/');
        } catch (error: unknown) {
            console.error('Google sign in error:', error);
            setError(messageFromUnknown(error, 'Đăng nhập bằng Google thất bại'));
        }
    }, [loginWithGoogle, router]);

    const initializeGoogleButton = useCallback(() => {
        if (!window.google || !buttonRef.current || !GOOGLE_CLIENT_ID || isInitialized) return;
        
        try {
            // Clear any existing button
            if (buttonRef.current) {
                buttonRef.current.innerHTML = '';
            }

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });

            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme,
                size,
                text,
                width: width || undefined,
            });
            setIsLoading(false);
            setIsInitialized(true);
        } catch (err) {
            console.error('Error initializing Google button:', err);
            setError('Lỗi khởi tạo Google Sign In');
            setIsLoading(false);
        }
    }, [GOOGLE_CLIENT_ID, theme, size, text, width, handleCredentialResponse, isInitialized]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            setIsLoading(false);
            setError('Google OAuth chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào file .env.local');
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            // Wait a bit for Google script to be ready
            const checkGoogle = setInterval(() => {
                if (window.google && buttonRef.current && !isInitialized) {
                    clearInterval(checkGoogle);
                    initializeGoogleButton();
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkGoogle);
                if (!window.google) {
                    setError('Không thể tải Google Sign In');
                    setIsLoading(false);
                }
            }, 5000);

            return () => clearInterval(checkGoogle);
        }

        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // Wait a bit for Google to be fully ready
            setTimeout(() => {
                if (window.google && buttonRef.current) {
                    initializeGoogleButton();
                } else {
                    setError('Không thể tải Google Sign In');
                    setIsLoading(false);
                }
            }, 100);
        };
        script.onerror = () => {
            setError('Không thể tải Google Sign In. Kiểm tra kết nối internet.');
            setIsLoading(false);
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [GOOGLE_CLIENT_ID, initializeGoogleButton, isInitialized]);

    // Show fallback button if Google Client ID is not configured
    if (!GOOGLE_CLIENT_ID) {
        return (
            <div className="w-full">
                <button
                    type="button"
                    disabled
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-500 cursor-not-allowed opacity-50"
                    title="Google OAuth chưa được cấu hình"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="font-medium">
                        {text === 'signup_with' ? 'Đăng ký bằng Google' : 'Đăng nhập bằng Google'}
                    </span>
                </button>
                <div className="mt-2 text-xs text-center text-gray-500">
                    ⚠️ Chưa cấu hình Google OAuth. Xem file GOOGLE_OAUTH_SETUP.md để hướng dẫn
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {error && (
                <div className="mb-2 text-sm text-red-600 text-center">{error}</div>
            )}
            <div 
                ref={buttonRef} 
                className={isLoading ? 'opacity-50 pointer-events-none' : ''}
            />
            {isLoading && (
                <div className="text-center text-sm text-gray-500 mt-2">Đang tải...</div>
            )}
        </div>
    );
}
