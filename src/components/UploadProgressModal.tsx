import { Cloud, FileSpreadsheet, X } from 'lucide-react';

export type UploadStatus = 'uploading' | 'processing' | 'complete' | 'error';

interface UploadProgressModalProps {
    isOpen: boolean;
    fileName: string;
    fileSize: number;
    status: UploadStatus;
    onCancel?: () => void;
}

// Format file size to human readable
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Status messages
const statusMessages: Record<UploadStatus, string> = {
    uploading: 'Uploading your file...',
    processing: 'Processing rows...',
    complete: 'Upload complete!',
    error: 'Upload failed',
};

export function UploadProgressModal({
    isOpen,
    fileName,
    fileSize,
    status,
    onCancel,
}: UploadProgressModalProps) {
    if (!isOpen) return null;

    const isInProgress = status === 'uploading' || status === 'processing';

    return (
        <div className="modal-overlay">
            <div className="modal max-w-sm animate-in">
                {/* Header with close/cancel */}
                <div className="flex justify-end p-4 pb-0">
                    {onCancel && isInProgress && (
                        <button
                            onClick={onCancel}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            title="Cancel upload"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 pb-8 pt-2 text-center">
                    {/* Animated Icon */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        {/* Cloud background */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Cloud
                                size={80}
                                className="text-indigo-100"
                                strokeWidth={1.5}
                            />
                        </div>
                        {/* Floating file icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`${isInProgress ? 'animate-upload-float' : ''}`}>
                                <FileSpreadsheet
                                    size={32}
                                    className="text-emerald-500"
                                    strokeWidth={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Text */}
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        {statusMessages[status]}
                    </h3>

                    {/* File Info */}
                    <p className="text-sm text-slate-500 mb-6">
                        <span className="font-medium text-slate-700">{fileName}</span>
                        <span className="mx-2">•</span>
                        <span>{formatFileSize(fileSize)}</span>
                    </p>

                    {/* Progress Bar */}
                    {isInProgress && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full animate-progress-pulse" />
                        </div>
                    )}

                    {/* Status indicator for complete/error */}
                    {status === 'complete' && (
                        <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
