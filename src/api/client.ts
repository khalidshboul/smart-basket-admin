import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aleah-nonoperational-cordia.ngrok-free.dev/smart-basket/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "ngrok-skip-browser-warning": "any-value",
        'Content-Type': 'application/json',
    },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
