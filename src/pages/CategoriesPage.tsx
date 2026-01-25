import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { bulkUploadApi } from '../api/bulkUploadApi';
import type { BulkUploadResponse } from '../api/bulkUploadApi';
import { Plus, Pencil, Trash2, Folder, Smile, ImageIcon, ChevronRight, ChevronDown, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import type { Category, CreateCategoryRequest } from '../types';

// Icon color classes for categories
const iconColors = [
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-purple-100 text-purple-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-cyan-100 text-cyan-600',
    'bg-indigo-100 text-indigo-600',
    'bg-emerald-100 text-emerald-600',
];

export function CategoriesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null);
    const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateCategoryRequest>({
        name: '',
        nameAr: '',
        icon: '',
        description: '',
        descriptionAr: '',
        displayOrder: 0,
        active: true,
        parentCategoryId: null,
    });

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: categoryApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateCategoryRequest }) =>
            categoryApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: categoryApi.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    const toggleMutation = useMutation({
        mutationFn: categoryApi.toggleStatus,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file, categoryId }: { file: File; categoryId: string }) =>
            bulkUploadApi.uploadItems(file, categoryId),
        onSuccess: (data) => {
            setUploadResult(data);
            setIsUploadModalOpen(true);
            setUploadingCategoryId(null);
            queryClient.invalidateQueries({ queryKey: ['reference-items'] });
        },
        onError: (error: Error) => {
            setUploadResult({
                success: false,
                totalRows: 0,
                successCount: 0,
                errorCount: 1,
                errors: [{
                    row: 0,
                    itemName: null,
                    errorType: 'SYSTEM',
                    field: null,
                    message: error.message
                }],
                invalidStores: [],
            });
            setIsUploadModalOpen(true);
            setUploadingCategoryId(null);
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.xlsx')) {
            setUploadingCategoryId(categoryId);
            uploadMutation.mutate({ file, categoryId });
        } else if (file) {
            alert('Please select an .xlsx file');
        }
        e.target.value = '';
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            nameAr: '',
            icon: '',
            description: '',
            descriptionAr: '',
            displayOrder: categories.length,
            active: true,
            parentCategoryId: null,
        });
        setShowEmojiPicker(false);
        setShowParentDropdown(false);
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            nameAr: category.nameAr || '',
            icon: category.icon || '',
            description: category.description || '',
            descriptionAr: category.descriptionAr || '',
            displayOrder: category.displayOrder,
            active: category.active,
            parentCategoryId: category.parentCategoryId || null,
        });
        setShowEmojiPicker(false);
        setShowParentDropdown(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setShowEmojiPicker(false);
        setShowParentDropdown(false);
    };


    // Get selected parent category for display
    const selectedParentCategory = formData.parentCategoryId
        ? categories.find(c => c.id === formData.parentCategoryId)
        : null;

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setFormData({ ...formData, icon: emojiData.emoji });
        setShowEmojiPicker(false);
    };

    const handleIconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, icon: reader.result as string }));
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading categories...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Items Categories</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Organize items for better browsing and comparisons.
                    </p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    <span>New Category</span>
                </button>
            </div>

            {/* Categories Grid */}
            {categories.length === 0 ? (
                <div className="card text-center py-12">
                    <Folder size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No categories yet</h3>
                    <p className="text-slate-500 mb-4">Create your first category to organize items.</p>
                    <button onClick={openCreateModal} className="btn btn-primary">
                        Create Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Parent Category Cards with Tree Structure */}
                    {categories.filter(c => !c.parentCategoryId).sort((a, b) => a.displayOrder - b.displayOrder).map((parent, parentIndex) => {
                        const isExpanded = expandedCategories.has(parent.id);

                        // Helper to get all children of a category
                        const getChildren = (parentId: string) =>
                            categories.filter(c => c.parentCategoryId === parentId).sort((a, b) => a.displayOrder - b.displayOrder);

                        const directChildren = getChildren(parent.id);
                        const hasChildren = directChildren.length > 0;

                        // Toggle expand/collapse
                        const toggleExpand = (id: string) => {
                            setExpandedCategories(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(id)) {
                                    newSet.delete(id);
                                } else {
                                    newSet.add(id);
                                }
                                return newSet;
                            });
                        };

                        // Recursive Tree Node Component
                        const renderTreeNode = (category: Category, level: number, colorIndex: number) => {
                            const children = getChildren(category.id);
                            const hasChildNodes = children.length > 0;
                            const isNodeExpanded = expandedCategories.has(category.id);
                            const indent = level * 24;

                            return (
                                <div key={category.id}>
                                    {/* Tree Node Row */}
                                    <div
                                        className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg group transition-all"
                                        style={{ marginLeft: `${indent}px` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Expand/Collapse or Connector */}
                                            {hasChildNodes ? (
                                                <button
                                                    onClick={() => toggleExpand(category.id)}
                                                    className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors"
                                                >
                                                    {isNodeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            ) : (
                                                <span className="w-5 h-5 flex items-center justify-center text-slate-300">
                                                    └
                                                </span>
                                            )}

                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${iconColors[colorIndex % iconColors.length]} overflow-hidden`}>
                                                {category.icon ? (
                                                    category.icon.startsWith('data:') || category.icon.startsWith('http') ? (
                                                        <img src={category.icon} alt={category.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        category.icon
                                                    )
                                                ) : (
                                                    <Folder size={14} />
                                                )}
                                            </div>

                                            {/* Name & Badge */}
                                            <span className="font-medium text-slate-700">{category.name}</span>
                                            {hasChildNodes && (
                                                <span className="text-xs text-slate-400">({children.length})</span>
                                            )}
                                            {!category.active && (
                                                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">inactive</span>
                                            )}
                                        </div>

                                        {/* Actions - visible on hover */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Upload button for subcategories (leaf nodes without children) */}
                                            {!hasChildNodes && (
                                                <label
                                                    className="p-1 text-emerald-500 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                                                    title="Upload Items"
                                                >
                                                    {uploadingCategoryId === category.id ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Upload size={14} />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept=".xlsx"
                                                        className="hidden"
                                                        onChange={(e) => handleFileSelect(e, category.id)}
                                                        disabled={uploadingCategoryId === category.id}
                                                    />
                                                </label>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const action = category.active ? 'deactivate' : 'activate';
                                                    if (confirm(`Are you sure you want to ${action} "${category.name}"?`)) {
                                                        toggleMutation.mutate(category.id);
                                                    }
                                                }}
                                                className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${category.active
                                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    }`}
                                                title={category.active ? 'Deactivate' : 'Activate'}
                                            >
                                                {category.active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(category)}
                                                className="p-1 text-slate-400 hover:text-primary-600 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Children */}
                                    {isNodeExpanded && children.map((child, idx) =>
                                        renderTreeNode(child, level + 1, colorIndex + idx + 1)
                                    )}
                                </div>
                            );
                        };

                        return (
                            <div key={parent.id} className="card p-0 overflow-hidden">
                                {/* Card Header - Parent Category (clickable to expand/collapse) */}
                                <div
                                    className={`flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white ${hasChildren ? 'cursor-pointer' : ''}`}
                                    onClick={() => hasChildren && toggleExpand(parent.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Expand chevron */}
                                        {hasChildren && (
                                            <div className="text-slate-400">
                                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                        )}
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconColors[parentIndex % iconColors.length]} shadow-sm overflow-hidden`}>
                                            {parent.icon ? (
                                                parent.icon.startsWith('data:') || parent.icon.startsWith('http') ? (
                                                    <img src={parent.icon} alt={parent.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    parent.icon
                                                )
                                            ) : (
                                                <Folder size={24} />
                                            )}
                                        </div>
                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-slate-800">{parent.name}</h3>
                                                {parent.active ? (
                                                    <span className="badge badge-success">Active</span>
                                                ) : (
                                                    <span className="badge badge-danger">Inactive</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {parent.description || 'No description'}
                                                {hasChildren && ` • ${directChildren.length} subcategories`}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    {/* Actions - stop propagation to prevent expand/collapse */}
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => {
                                                const action = parent.active ? 'deactivate' : 'activate';
                                                if (confirm(`Are you sure you want to ${action} "${parent.name}"?`)) {
                                                    toggleMutation.mutate(parent.id);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${parent.active
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {parent.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(parent)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(parent.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tree Content */}
                                {hasChildren && isExpanded && (
                                    <div className="p-2 pt-0">
                                        {/* Tree Nodes */}
                                        {directChildren.map((child, idx) =>
                                            renderTreeNode(child, 0, parentIndex + idx + 1)
                                        )}
                                    </div>
                                )}

                                {/* Footer - Add Subcategory */}
                                <div className="px-4 py-3 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                parentCategoryId: parent.id,
                                                name: '',
                                                nameAr: '',
                                                icon: '',
                                                description: '',
                                                descriptionAr: '',
                                                displayOrder: directChildren.length,
                                                active: true,
                                            });
                                            setEditingCategory(null);
                                            setIsModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                    >
                                        <Plus size={16} />
                                        Add Subcategory
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Promo Banner */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-md">
                        <h2 className="text-2xl font-bold mb-2">Optimize Your Items Categories</h2>
                        <p className="text-slate-400 text-sm">
                            Organize your products efficiently for better user experience and faster price comparisons.
                        </p>
                    </div>
                    <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-primary-50 transition-all">
                        View Analytics
                    </button>
                </div>
                {/* Decorative blurs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div>
                                    <label className="form-label">Name (English) *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Dairy Products"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Name (Arabic)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        dir="rtl"
                                        value={formData.nameAr || ''}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        placeholder="مثال: منتجات الألبان"
                                    />
                                </div>
                                {/* Parent Category Selector */}
                                <div>
                                    <label className="form-label">Parent Category (optional)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowParentDropdown(!showParentDropdown)}
                                            className="form-input w-full text-left flex items-center justify-between"
                                        >
                                            {selectedParentCategory ? (
                                                <span className="flex items-center gap-2">
                                                    {selectedParentCategory.icon && (
                                                        selectedParentCategory.icon.startsWith('data:') || selectedParentCategory.icon.startsWith('http') ? (
                                                            <img src={selectedParentCategory.icon} alt="" className="w-5 h-5 rounded object-cover" />
                                                        ) : (
                                                            <span>{selectedParentCategory.icon}</span>
                                                        )
                                                    )}
                                                    {selectedParentCategory.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">None (Top-level category)</span>
                                            )}
                                            <ChevronRight size={16} className={`text - slate - 400 transition - transform ${showParentDropdown ? 'rotate-90' : ''} `} />
                                        </button>
                                        {showParentDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                                {/* None option */}
                                                <div
                                                    onClick={() => { setFormData({ ...formData, parentCategoryId: null }); setShowParentDropdown(false); }}
                                                    className={`flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer ${!formData.parentCategoryId ? 'bg-primary-50' : ''}`}
                                                >
                                                    <span className="text-slate-500">None (Top-level category)</span>
                                                </div>

                                                {/* Hierarchical categories */}
                                                {categories
                                                    .filter(c => !c.parentCategoryId)
                                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                                    .map(parent => {
                                                        // Recursive function to render category and its children
                                                        const renderCategoryOption = (cat: Category, level: number): React.ReactNode[] => {
                                                            const catChildren = categories
                                                                .filter(c => c.parentCategoryId === cat.id)
                                                                .sort((a, b) => a.displayOrder - b.displayOrder);
                                                            const isEditing = editingCategory?.id === cat.id;

                                                            const elements: React.ReactNode[] = [
                                                                <div
                                                                    key={cat.id}
                                                                    onClick={() => {
                                                                        if (!isEditing) {
                                                                            setFormData({ ...formData, parentCategoryId: cat.id });
                                                                            setShowParentDropdown(false);
                                                                        }
                                                                    }}
                                                                    className={`flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer ${formData.parentCategoryId === cat.id ? 'bg-primary-50' : ''
                                                                        } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    style={{ paddingLeft: `${8 + level * 16}px` }}
                                                                >
                                                                    {level > 0 && <span className="text-slate-300 text-xs">└</span>}
                                                                    {cat.icon && (
                                                                        cat.icon.startsWith('data:') || cat.icon.startsWith('http') ? (
                                                                            <img src={cat.icon} alt="" className="w-5 h-5 rounded object-cover" />
                                                                        ) : (
                                                                            <span>{cat.icon}</span>
                                                                        )
                                                                    )}
                                                                    <span className={`truncate ${level === 0 ? 'font-medium' : ''}`}>{cat.name}</span>
                                                                    {catChildren.length > 0 && (
                                                                        <span className="text-xs text-slate-400">({catChildren.length})</span>
                                                                    )}
                                                                    {isEditing && <span className="text-xs text-slate-400">(editing)</span>}
                                                                </div>
                                                            ];

                                                            // Recursively add children
                                                            catChildren.forEach(child => {
                                                                elements.push(...renderCategoryOption(child, level + 1));
                                                            });

                                                            return elements;
                                                        };

                                                        return renderCategoryOption(parent, 0);
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Leave empty for a top-level category, or select a parent to create a subcategory.</p>
                                </div>
                                <div>
                                    <label className="form-label">Icon</label>
                                    {/* URL Input */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="url"
                                            className="form-input flex-1"
                                            value={formData.icon?.startsWith('data:') || (formData.icon && !formData.icon.startsWith('http')) ? '' : (formData.icon || '')}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            placeholder={formData.icon && !formData.icon.startsWith('http') ? 'Clear icon to enter URL' : 'https://s3.amazonaws.com/bucket/icon.png'}
                                            disabled={!!(formData.icon && !formData.icon.startsWith('http'))}
                                        />
                                        {formData.icon && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: '' })}
                                                className="btn btn-danger btn-sm"
                                                title="Clear icon"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    {/* Emoji & File Upload */}
                                    <div className="flex gap-3 items-center">
                                        <div className="relative flex-1" ref={emojiPickerRef}>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                    className="btn btn-secondary flex items-center gap-2"
                                                >
                                                    <Smile size={18} />
                                                    Pick Emoji
                                                </button>
                                                <label className="btn btn-secondary cursor-pointer flex items-center gap-2">
                                                    <ImageIcon size={18} />
                                                    Browse Image
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleIconFileSelect}
                                                    />
                                                </label>
                                            </div>
                                            {showEmojiPicker && (
                                                <div className="absolute z-50 mt-2 left-0">
                                                    <EmojiPicker
                                                        onEmojiClick={handleEmojiClick}
                                                        width={300}
                                                        height={400}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                                            {formData.icon ? (
                                                formData.icon.startsWith('data:') || formData.icon.startsWith('http') ? (
                                                    <img src={formData.icon} alt="Icon" className="w-full h-full object-cover" />
                                                ) : (
                                                    formData.icon
                                                )
                                            ) : (
                                                <Folder size={24} className="text-slate-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Description (English)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Description (Arabic)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        dir="rtl"
                                        value={formData.descriptionAr || ''}
                                        onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                        placeholder="وصف اختياري"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Display Order</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-slate-700">Active (visible in item dropdown)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Result Modal */}
            {isUploadModalOpen && uploadResult && (
                <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
                    <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title flex items-center gap-2">
                                {uploadResult.errorCount === 0 ? (
                                    <><CheckCircle className="text-green-500" size={24} /> Upload Successful</>
                                ) : (
                                    <><AlertCircle className="text-red-500" size={24} /> Upload Failed</>
                                )}
                            </h2>
                            <button className="modal-close" onClick={() => setIsUploadModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-slate-800">{uploadResult.totalRows}</div>
                                    <div className="text-xs text-slate-500">Total Rows</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-green-600">{uploadResult.successCount}</div>
                                    <div className="text-xs text-slate-500">Success</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-red-600">{uploadResult.errorCount}</div>
                                    <div className="text-xs text-slate-500">Errors</div>
                                </div>
                            </div>

                            {/* {uploadResult.invalidStores && uploadResult.invalidStores.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <h4 className="font-medium text-amber-800 mb-1">Invalid Stores</h4>
                                    <p className="text-sm text-amber-700">
                                        {uploadResult.invalidStores.join(', ')}
                                    </p>
                                </div>
                            )} */}

                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <h4 className="font-medium text-red-800 mb-2">Errors ({uploadResult.errors.length})</h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {uploadResult.errors.map((error, idx) => (
                                            <div key={idx} className="bg-white rounded border border-red-100 p-2 text-sm">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {error.row > 0 && (
                                                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                                            Row {error.row}
                                                        </span>
                                                    )}
                                                    
                                                </div>
                                                <div className="text-red-700">
                                                    {error.itemName && <span className="font-medium">{error.itemName}: </span>}
                                                    {error.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary w-full" onClick={() => setIsUploadModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
