import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { referenceItemApi } from '../api/referenceItemApi';
import { storeApi } from '../api/storeApi';
import { categoryApi } from '../api/categoryApi';
import { Plus, Pencil, Trash2, Package, Search, ImageIcon, Link } from 'lucide-react';
import type { ReferenceItem, CreateReferenceItemRequest, Store } from '../types';

export function ItemsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [formData, setFormData] = useState<CreateReferenceItemRequest>({
        name: '',
        nameAr: '',
        categoryId: '',
        description: '',
        descriptionAr: '',
        images: [],
        barcode: '',
        availableInAllStores: true,
        specificStoreIds: [],
    });

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['items'],
        queryFn: referenceItemApi.getAll,
    });

    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: storeApi.getAll,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories', 'active'],
        queryFn: categoryApi.getActive,
    });

    const createMutation = useMutation({
        mutationFn: referenceItemApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateReferenceItemRequest }) =>
            referenceItemApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: referenceItemApi.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
    });

    const toggleMutation = useMutation({
        mutationFn: referenceItemApi.toggleStatus,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
        onError: (error: Error) => {
            alert(`Failed to toggle item status: ${error.message}`);
        },
    });

    // Filter items - include subcategory items when filtering by parent category
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

        // If no category filter, show all
        if (!filterCategory) {
            return matchesSearch;
        }

        // Check if the filter is a parent category
        const selectedCategory = categories.find(c => c.id === filterCategory);
        const isParentCategory = selectedCategory && !selectedCategory.parentCategoryId;

        if (isParentCategory) {
            // Include items from this parent AND all its subcategories
            const subcategoryIds = categories
                .filter(c => c.parentCategoryId === filterCategory)
                .map(c => c.id);
            const matchesCategory = item.categoryId === filterCategory || subcategoryIds.includes(item.categoryId);
            return matchesSearch && matchesCategory;
        } else {
            // Exact match for subcategory
            const matchesCategory = item.categoryId === filterCategory;
            return matchesSearch && matchesCategory;
        }
    });

    // Helper to render category icon
    const renderCategoryIcon = (icon: string | null | undefined, size: string = 'w-5 h-5') => {
        if (!icon) return null;
        // Check if it's an image URL/data (long string, or contains image indicators)
        const isImage = icon.startsWith('data:') ||
            icon.startsWith('http') ||
            icon.startsWith('/') ||
            icon.includes('base64') ||
            icon.length > 20; // Emojis are typically 1-4 chars, Base64 is very long
        if (isImage) {
            return <img src={icon} alt="" className={`${size} rounded object-cover flex-shrink-0`} />;
        }
        return <span className="flex-shrink-0">{icon}</span>;
    };

    // Get selected category for display
    const selectedFilterCategory = categories.find(c => c.id === filterCategory);
    const selectedFormCategory = categories.find(c => c.id === formData.categoryId);

    // Sort categories: parents first, then their subcategories immediately after
    const sortedCategories = [...categories].sort((a, b) => {
        // Both are top-level: sort by displayOrder
        if (!a.parentCategoryId && !b.parentCategoryId) {
            return a.displayOrder - b.displayOrder;
        }
        // Both have same parent: sort by displayOrder
        if (a.parentCategoryId === b.parentCategoryId) {
            return a.displayOrder - b.displayOrder;
        }
        // a is parent, b is its child: parent comes first
        if (b.parentCategoryId === a.id) {
            return -1;
        }
        // b is parent, a is its child: parent comes first
        if (a.parentCategoryId === b.id) {
            return 1;
        }
        // a is child of some parent, b is top-level
        if (a.parentCategoryId && !b.parentCategoryId) {
            const aParent = categories.find(c => c.id === a.parentCategoryId);
            // Place child after its parent in the overall order
            return (aParent?.displayOrder ?? 0) - b.displayOrder || 1;
        }
        // b is child of some parent, a is top-level
        if (!a.parentCategoryId && b.parentCategoryId) {
            const bParent = categories.find(c => c.id === b.parentCategoryId);
            return a.displayOrder - (bParent?.displayOrder ?? 0) || -1;
        }
        // Both are children of different parents: sort by parent displayOrder
        const aParent = categories.find(c => c.id === a.parentCategoryId);
        const bParent = categories.find(c => c.id === b.parentCategoryId);
        return (aParent?.displayOrder ?? 0) - (bParent?.displayOrder ?? 0);
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            nameAr: '',
            categoryId: categories.length > 0 ? categories[0].id : '',
            description: '',
            descriptionAr: '',
            images: [],
            barcode: '',
            availableInAllStores: true,
            specificStoreIds: [],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: ReferenceItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            nameAr: item.nameAr || '',
            categoryId: item.categoryId || '',
            description: item.description || '',
            descriptionAr: item.descriptionAr || '',
            images: item.images || [],
            barcode: item.barcode || '',
            availableInAllStores: item.availableInAllStores ?? true,
            specificStoreIds: item.specificStoreIds || [],
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const newImages: string[] = [];
        let loadedCount = 0;

        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                newImages.push(reader.result as string);
                loadedCount++;

                // Only update state after all files are loaded
                if (loadedCount === fileArray.length) {
                    setFormData(prev => ({
                        ...prev,
                        images: [...(prev.images || []), ...newImages],
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; // Reset input
    };

    const handleRemoveImage = (index: number) => {
        setFormData({
            ...formData,
            images: (formData.images || []).filter((_, i) => i !== index),
        });
    };

    const handleStoreToggle = (storeId: string) => {
        const current = formData.specificStoreIds || [];
        if (current.includes(storeId)) {
            setFormData({ ...formData, specificStoreIds: current.filter((id: string) => id !== storeId) });
        } else {
            setFormData({ ...formData, specificStoreIds: [...current, storeId] });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading items...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Reference Items</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage your product catalog and store availability.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
                        <Plus size={20} />
                        <span>Add Item</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-input pl-10"
                    />
                </div>
                <div className="relative w-full sm:w-48">
                    <button
                        type="button"
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="form-input w-full text-left flex items-center gap-2"
                    >
                        {selectedFilterCategory ? (
                            <>
                                {renderCategoryIcon(selectedFilterCategory.icon)}
                                <span className="truncate">{selectedFilterCategory.name}</span>
                            </>
                        ) : (
                            <span className="text-slate-400">All Categories</span>
                        )}
                    </button>
                    {showFilterDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            <div
                                onClick={() => { setFilterCategory(''); setShowFilterDropdown(false); }}
                                className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer text-slate-500 border-b border-slate-100"
                            >
                                All Categories
                            </div>
                            {sortedCategories.map((cat, index) => {
                                const isParent = !cat.parentCategoryId;
                                const showDivider = isParent && index > 0;

                                return (
                                    <div key={cat.id}>
                                        {showDivider && <div className="border-t border-slate-200 my-1" />}
                                        <div
                                            onClick={() => { setFilterCategory(cat.id); setShowFilterDropdown(false); }}
                                            className={`flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer 
                                                ${filterCategory === cat.id ? 'bg-primary-50' : ''} 
                                                ${isParent ? 'bg-slate-50' : 'pl-8'}`}
                                        >
                                            {!isParent && <span className="text-slate-300 text-sm">└─</span>}
                                            {renderCategoryIcon(cat.icon, isParent ? 'w-6 h-6' : 'w-5 h-5')}
                                            <span className={`truncate ${isParent ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                {cat.name}
                                            </span>
                                            {isParent && cat.subcategoryCount > 0 && (
                                                <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full ml-auto">
                                                    {cat.subcategoryCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
                <div className="card text-center py-12">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        {items.length === 0 ? 'No items yet' : 'No items match your search'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {items.length === 0 ? 'Create your first reference item.' : 'Try adjusting your filters.'}
                    </p>
                    {items.length === 0 && (
                        <button onClick={openCreateModal} className="btn btn-primary">Create Item</button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="card group hover:shadow-md transition-all duration-200">
                            {/* Image placeholder */}
                            <div className="w-full h-32 bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                                {item.images && item.images.length > 0 ? (
                                    <img
                                        src={item.images[0]}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <Package size={40} className="text-slate-300" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                                    <div className="flex items-center gap-1">
                                        {item.images && item.images.length > 1 && (
                                            <span className="badge badge-info flex items-center gap-1">
                                                <ImageIcon size={12} />
                                                {item.images.length}
                                            </span>
                                        )}
                                        {item.active ? (
                                            <span className="badge badge-success">Active</span>
                                        ) : (
                                            <span className="badge badge-danger">Inactive</span>
                                        )}
                                    </div>
                                </div>
                                <span className="badge badge-info">{item.category}</span>
                                <p className="text-sm text-slate-500 line-clamp-2">
                                    {item.description || 'No description'}
                                </p>

                                {/* Availability */}
                                <div className="flex items-center gap-2 text-xs">
                                    {item.availableInAllStores ? (
                                        <span className="text-green-600">✓ All stores</span>
                                    ) : (
                                        <span className="text-amber-600">
                                            {item.specificStoreIds?.length || 0} specific stores
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        const action = item.active ? 'deactivate' : 'activate';
                                        const confirmed = window.confirm(`Are you sure you want to ${action} "${item.name}"?`);
                                        if (confirmed) {
                                            toggleMutation.mutate(item.id);
                                        }
                                    }}
                                    disabled={toggleMutation.isPending}
                                    className={`btn btn-sm flex-1 ${item.active
                                        ? 'btn-secondary'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        } ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {toggleMutation.isPending ? 'Processing...' : (item.active ? 'Deactivate' : 'Activate')}
                                </button>
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="btn btn-danger btn-sm"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingItem ? 'Edit Item' : 'New Item'}
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
                                        placeholder="الاسم بالعربية"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Category *</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                            className="form-input w-full text-left flex items-center gap-2"
                                        >
                                            {selectedFormCategory ? (
                                                <>
                                                    {renderCategoryIcon(selectedFormCategory.icon)}
                                                    <span className="truncate">{selectedFormCategory.name}</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">Select category...</span>
                                            )}
                                        </button>
                                        {showCategoryDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                                {/* Recursive category rendering */}
                                                {(() => {
                                                    const renderCategoryOptions = (parentId: string | null, level: number): React.ReactNode[] => {
                                                        return categories
                                                            .filter(c => c.parentCategoryId === parentId)
                                                            .sort((a, b) => a.displayOrder - b.displayOrder)
                                                            .flatMap(cat => {
                                                                const children = categories.filter(c => c.parentCategoryId === cat.id);
                                                                const hasChildren = children.length > 0;
                                                                const isTopLevel = level === 0;

                                                                return [
                                                                    <div
                                                                        key={cat.id}
                                                                        onClick={() => { setFormData({ ...formData, categoryId: cat.id }); setShowCategoryDropdown(false); }}
                                                                        className={`flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer 
                                                                            ${formData.categoryId === cat.id ? 'bg-primary-50' : ''} 
                                                                            ${isTopLevel ? 'bg-slate-50' : ''}`}
                                                                        style={{ paddingLeft: `${8 + level * 16}px` }}
                                                                    >
                                                                        {level > 0 && <span className="text-slate-300 text-sm">└</span>}
                                                                        {renderCategoryIcon(cat.icon, isTopLevel ? 'w-6 h-6' : 'w-5 h-5')}
                                                                        <span className={`truncate ${isTopLevel ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                                            {cat.name}
                                                                        </span>
                                                                        {hasChildren && (
                                                                            <span className="text-xs text-slate-400">({children.length})</span>
                                                                        )}
                                                                    </div>,
                                                                    ...renderCategoryOptions(cat.id, level + 1)
                                                                ];
                                                            });
                                                    };
                                                    return renderCategoryOptions(null, 0);
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <input type="hidden" name="categoryId" value={formData.categoryId} required />
                                </div>

                                <div>
                                    <label className="form-label">Description (English)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                        placeholder="الوصف بالعربية"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">Barcode</label>
                                    <input
                                        type="text"
                                        className="form-input font-mono"
                                        value={formData.barcode || ''}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        placeholder="e.g., 6291003081024"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Enter the product's barcode (EAN-13, UPC-A, etc.)
                                    </p>
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="form-label">Images</label>
                                    {/* URL Input */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="url"
                                            className="form-input flex-1"
                                            value={imageUrlInput}
                                            onChange={(e) => setImageUrlInput(e.target.value)}
                                            placeholder="https://s3.amazonaws.com/bucket/image.png"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (imageUrlInput.trim()) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        images: [...(prev.images || []), imageUrlInput.trim()],
                                                    }));
                                                    setImageUrlInput('');
                                                }
                                            }}
                                            className="btn btn-secondary flex items-center gap-1"
                                        >
                                            <Link size={16} />
                                            Add URL
                                        </button>
                                    </div>
                                    {/* Image Thumbnails */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(formData.images || []).map((url, i) => (
                                            <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                <img
                                                    src={url}
                                                    alt={`Image ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(i)}
                                                    className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Browse Button */}
                                    <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2">
                                        <ImageIcon size={18} />
                                        Browse Images
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                </div>

                                {/* Store Availability */}
                                <div>
                                    <label className="form-label">Store Availability</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={formData.availableInAllStores}
                                                onChange={() => setFormData({ ...formData, availableInAllStores: true, specificStoreIds: [] })}
                                            />
                                            <span className="text-sm">All stores</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={!formData.availableInAllStores}
                                                onChange={() => setFormData({ ...formData, availableInAllStores: false })}
                                            />
                                            <span className="text-sm">Specific stores only</span>
                                        </label>
                                    </div>
                                    {!formData.availableInAllStores && (
                                        <div className="mt-2 p-3 bg-slate-50 rounded-lg max-h-32 overflow-y-auto space-y-1">
                                            {stores.map((s: Store) => (
                                                <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.specificStoreIds || []).includes(s.id)}
                                                        onChange={() => handleStoreToggle(s.id)}
                                                    />
                                                    {s.name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!formData.categoryId}>
                                    {editingItem ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
