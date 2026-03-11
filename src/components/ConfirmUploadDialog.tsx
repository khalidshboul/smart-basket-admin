import { FileSpreadsheet, Folder } from 'lucide-react';

interface ConfirmUploadDialogProps {
    isOpen: boolean;
    fileName: string;
    fileSize: number;
    categoryName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function ConfirmUploadDialog({
    isOpen,
    fileName,
    fileSize,
    categoryName,
    onConfirm,
    onCancel,
}: ConfirmUploadDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Confirm Upload</h2>
                    <button className="modal-close" onClick={onCancel} aria-label="Close">×</button>
                </div>
                <div className="modal-body">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FileSpreadsheet size={28} />
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs uppercase text-slate-400 tracking-wide">File Details</div>
                            <div className="mt-2 flex items-center gap-2 text-slate-700">
                                <FileSpreadsheet size={16} className="text-emerald-600" />
                                <span className="font-medium truncate">{fileName}</span>
                            </div>
                            <div className="mt-1 text-sm text-slate-500">{formatFileSize(fileSize)}</div>
                        </div>

                        <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
                            <div className="text-xs uppercase text-primary-500 tracking-wide">Upload Destination</div>
                            <div className="mt-2 flex items-center gap-2 text-primary-700">
                                <Folder size={16} />
                                <span className="font-semibold truncate">Category: {categoryName}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onConfirm}>
                        Confirm Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
