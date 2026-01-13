'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/api';

interface User {
    id: number;
    email: string;
    fullName: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    loginWithGoogle: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async () => {
        try {
            // Try to get user from API
            const { data } = await apiClient.get('/auth/me');
            setUser(data);
        } catch (error: any) {
            // If API fails, clear storage
            if (error.response?.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if user is logged in and fetch user data on mount
        const token = localStorage.getItem('accessToken');
        if (token) {
            // Fetch user data from API
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await apiClient.post('/auth/login', { email, password });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            throw new Error(message);
        }
    };

    const register = async (formData: any) => {
        try {
            await apiClient.post('/auth/register', formData);
            // Registration successful - user will need to login
            // After registration, automatically login
            await login(formData.email, formData.password);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Registration failed';
            throw new Error(message);
        }
    };

    const loginWithGoogle = async (token: string) => {
        try {
            const { data } = await apiClient.post('/auth/google', { token });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Google login failed';
            throw new Error(message);
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        window.location.href = '/auth/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
