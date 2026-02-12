import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
    (response) => {
        // Log successful responses for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
        }
        return response;
    },
    async (error) => {
        // Log errors for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            if (error.response) {
                console.error(`❌ API Error ${error.response.status}:`, {
                    url: error.config?.url,
                    method: error.config?.method,
                    message: error.response.data?.message || error.message,
                    data: error.response.data,
                });
            } else if (error.request) {
                console.error('❌ Network Error:', {
                    url: error.config?.url,
                    message: 'Không thể kết nối đến server. Kiểm tra xem backend có đang chạy không.',
                });
            } else {
                console.error('❌ Request Error:', error.message);
            }
        }

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/auth/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
