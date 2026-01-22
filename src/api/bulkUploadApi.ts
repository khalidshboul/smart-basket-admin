import { apiClient } from './client';

export interface BulkUploadResponse {
    totalSheets: number;
    totalRows: number;
    successCount: number;
    errorCount: number;
    sheetResults: {
        sheetName: string;
        storeName: string;
        rowsProcessed: number;
        successCount: number;
        errorCount: number;
    }[];
    errors: {
        sheetName: string;
        rowNumber: number;
        itemName: string;
        errorMessage: string;
    }[];
}

export const bulkUploadApi = {
    uploadItems: async (file: File): Promise<BulkUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<BulkUploadResponse>('bulk-upload/items', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
