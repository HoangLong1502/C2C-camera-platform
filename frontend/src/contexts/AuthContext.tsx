'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import apiClient from '../lib/api';

interface User {
    id: number;
    email: string;
    fullName: string;
    role: string;
    phone?: string | null;
    walletBalance?: number | string | null;
}

export interface RegisterPayload {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
}

export function messageFromUnknown(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
            return (data as { message: string }).message;
        }
        if (error.message) return error.message;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterPayload) => Promise<void>;
    loginWithGoogle: (token: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
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
        } catch (error: unknown) {
            // If API fails, clear storage
            if (axios.isAxiosError(error) && error.response?.status === 401) {
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
        } catch (error: unknown) {
            throw new Error(messageFromUnknown(error, 'Login failed'));
        }
    };

    const register = async (formData: RegisterPayload) => {
        try {
            await apiClient.post('/auth/register', formData);
            // Registration successful - user will need to login
            // After registration, automatically login
            await login(formData.email, formData.password);
        } catch (error: unknown) {
            throw new Error(messageFromUnknown(error, 'Registration failed'));
        }
    };

    const loginWithGoogle = async (token: string) => {
        try {
            const { data } = await apiClient.post('/auth/google', { token });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
        } catch (error: unknown) {
            throw new Error(messageFromUnknown(error, 'Google login failed'));
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        window.location.href = '/auth/login';
    };

    const refreshUser = async () => {
        await fetchUserData();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
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
