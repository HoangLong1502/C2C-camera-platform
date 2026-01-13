'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
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
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn('Google Client ID is not configured');
            return;
        }

        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google && buttonRef.current) {
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
            }
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [GOOGLE_CLIENT_ID, theme, size, text, width]);

    const handleCredentialResponse = async (response: any) => {
        try {
            await loginWithGoogle(response.credential);
            router.push('/');
        } catch (error: any) {
            console.error('Google sign in error:', error);
            alert(error.message || 'Failed to sign in with Google');
        }
    };

    if (!GOOGLE_CLIENT_ID) {
        return null;
    }

    return <div ref={buttonRef} />;
}
