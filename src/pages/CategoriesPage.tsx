import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { Plus, Pencil, Trash2, Folder, Smile, ImageIcon } from 'lucide-react';
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
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState<CreateCategoryRequest>({
        name: '',
        nameAr: '',
        icon: '',
        description: '',
        descriptionAr: '',
        displayOrder: 0,
        active: true,
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
        });
        setShowEmojiPicker(false);
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
        });
        setShowEmojiPicker(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setShowEmojiPicker(false);
    };

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categories.map((category, index) => (
                        <div
                            key={category.id}
                            className="card flex items-center justify-between group hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${iconColors[index % iconColors.length]} shadow-sm group-hover:scale-110 transition-transform duration-200 overflow-hidden`}>
                                    {category.icon ? (
                                        category.icon.startsWith('data:') || category.icon.startsWith('http') ? (
                                            <img src={category.icon} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            category.icon
                                        )
                                    ) : (
                                        <Folder size={24} />
                                    )}
                                </div>
                                {/* Info */}
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{category.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                            {category.description || 'No description'}
                                        </span>
                                        {category.active ? (
                                            <span className="badge badge-success">Active</span>
                                        ) : (
                                            <span className="badge badge-danger">Inactive</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        const action = category.active ? 'deactivate' : 'activate';
                                        if (confirm(`Are you sure you want to ${action} "${category.name}"?`)) {
                                            toggleMutation.mutate(category.id);
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category.active
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {category.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => openEditModal(category)}
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                    title="Edit"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
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
                                <div>
                                    <label className="form-label">Icon</label>
                                    {/* URL Input */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="url"
                                            className="form-input flex-1"
                                            value={formData.icon?.startsWith('data:') ? '' : (formData.icon || '')}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            placeholder="https://s3.amazonaws.com/bucket/icon.png"
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
        </div>
    );
}
