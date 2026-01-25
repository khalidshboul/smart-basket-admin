import axios from 'axios';
import { apiClient } from './client';

export interface RowError {
    row: number;
    itemName: string | null;
    errorType: 'VALIDATION' | 'DUPLICATE' | 'PRICE' | 'STORE' | 'SYSTEM';
    field: string | null;
    message: string;
}

export interface BulkUploadResponse {
    success: boolean;
    totalRows: number;
    successCount: number;
    errorCount: number;
    categoryId?: string;
    categoryName?: string;
    invalidStores: string[];
    errors: RowError[];
}

export const bulkUploadApi = {
    uploadItems: async (file: File, categoryId: string): Promise<BulkUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('categoryId', categoryId);

        try {
            const response = await apiClient.post<BulkUploadResponse>('bulk-upload/items', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            // If axios error with response body, extract the structured error
            if (axios.isAxiosError(error) && error.response?.data) {
                const errorData = error.response.data as BulkUploadResponse;
                // Check if it's a structured error response from our API
                if (errorData.errors !== undefined) {
                    return errorData;
                }
            }
            // Fallback: create a generic error response
            throw error;
        }
    },
};
