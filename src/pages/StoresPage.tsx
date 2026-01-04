import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '../api/storeApi';
import { Plus, Pencil, Trash2, Store as StoreIcon, MapPin, ImageIcon } from 'lucide-react';
import type { Store, CreateStoreRequest } from '../types';

export function StoresPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);
    const [formData, setFormData] = useState<CreateStoreRequest>({
        name: '',
        nameAr: '',
        location: '',
        locationAr: '',
        logoUrl: '',
    });

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['stores'],
        queryFn: storeApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: storeApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateStoreRequest }) =>
            storeApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
            closeModal();
        },
    });

    const toggleMutation = useMutation({
        mutationFn: storeApi.toggleStatus,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
        onError: (error: Error) => {
            console.error('Toggle error:', error);
            alert(`Failed to toggle store status: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: storeApi.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
    });

    const openCreateModal = () => {
        setEditingStore(null);
        setFormData({ name: '', nameAr: '', location: '', locationAr: '', logoUrl: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (store: Store) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            nameAr: store.nameAr || '',
            location: store.location || '',
            locationAr: store.locationAr || '',
            logoUrl: store.logoUrl || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStore(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStore) {
            updateMutation.mutate({ id: editingStore.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this store?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading stores...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Stores</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage store locations and compare prices.
                    </p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    <span>Add Store</span>
                </button>
            </div>

            {/* Stores Grid */}
            {stores.length === 0 ? (
                <div className="card text-center py-12">
                    <StoreIcon size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No stores yet</h3>
                    <p className="text-slate-500 mb-4">Add your first store to start tracking prices.</p>
                    <button onClick={openCreateModal} className="btn btn-primary">Add Store</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stores.map((store) => (
                        <div key={store.id} className="card group hover:shadow-md transition-all duration-200">
                            {/* Logo */}
                            <div className="w-full h-24 bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                                {store.logoUrl ? (
                                    <img
                                        src={store.logoUrl}
                                        alt={store.name}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <StoreIcon size={40} className="text-slate-300" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-lg text-slate-800">{store.name}</h3>
                                    {store.active ? (
                                        <span className="badge badge-success">Active</span>
                                    ) : (
                                        <span className="badge badge-danger">Inactive</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <MapPin size={14} />
                                    {store.location || 'No location specified'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        const action = store.active ? 'deactivate' : 'activate';
                                        if (confirm(`Are you sure you want to ${action} "${store.name}"?`)) {
                                            toggleMutation.mutate(store.id);
                                        }
                                    }}
                                    className={`btn btn-sm flex-1 ${store.active ? 'btn-secondary' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                >
                                    {store.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => openEditModal(store)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(store.id)}
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingStore ? 'Edit Store' : 'New Store'}
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
                                        placeholder="e.g., Carrefour"
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
                                        placeholder="مثال: كارفور"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Location (English)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., Downtown Mall"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Location (Arabic)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        dir="rtl"
                                        value={formData.locationAr || ''}
                                        onChange={(e) => setFormData({ ...formData, locationAr: e.target.value })}
                                        placeholder="مثال: مول وسط البلد"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Logo</label>
                                    <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2 mb-2">
                                        <ImageIcon size={18} />
                                        Browse Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleLogoFileSelect}
                                        />
                                    </label>
                                    {formData.logoUrl && (
                                        <div className="p-4 bg-slate-50 rounded-lg flex justify-center">
                                            <img
                                                src={formData.logoUrl}
                                                alt="Preview"
                                                className="max-h-16 object-contain"
                                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingStore ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
