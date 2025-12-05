import React, { useState, useEffect } from 'react';
import { FaLayerGroup, FaTimes, FaCheck, FaBars } from 'react-icons/fa';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CampaignCategory {
    id: string;
    name: string;
    description: string;
    rank?: number;
}

interface CampaignCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const CampaignCategoriesModal: React.FC<CampaignCategoriesModalProps> = ({ isOpen, onClose, onUpdate }) => {
    const [categories, setCategories] = useState<CampaignCategory[]>([]);
    const [catName, setCatName] = useState('');
    const [catDescription, setCatDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [hasOrderChanged, setHasOrderChanged] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${backendUrl}/campaign-categories`);
            if (response.ok) {
                const data = await response.json();
                const sortedData = Array.isArray(data)
                    ? data.sort((a: CampaignCategory, b: CampaignCategory) => (a.rank || 0) - (b.rank || 0))
                    : [];
                setCategories(sortedData);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // Calculate new rank (last + 1)
            const maxRank = categories.length > 0 ? Math.max(...categories.map(c => c.rank || 0)) : 0;
            const newRank = maxRank + 1;

            const response = await fetch(`${backendUrl}/campaign-categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: catName,
                    description: catDescription,
                    rank: newRank
                }),
            });

            if (response.ok) {
                await fetchCategories();
                onUpdate(); // Refresh parent
                setCatName('');
                setCatDescription('');
                setMessage({ type: 'success', text: 'Category created!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to create category' });
            }
        } catch (error) {
            console.error('Error creating category:', error);
            setMessage({ type: 'error', text: 'Error creating category' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);
                setHasOrderChanged(true);
                return newItems;
            });
        }
    };

    const handleSaveOrder = async () => {
        try {
            const updates = categories.map((item, index) => ({
                category_id: item.id,
                rank: index + 1
            }));

            const response = await fetch(`${backendUrl}/campaign-categories/realign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error('Failed to update ranks');
            }

            setMessage({ type: 'success', text: 'Order saved successfully' });
            setHasOrderChanged(false);
            onUpdate(); // Refresh parent if needed

        } catch (error) {
            console.error('Error updating ranks:', error);
            setMessage({ type: 'error', text: 'Failed to save new order' });
            fetchCategories(); // Re-fetch to reset to server state
            setHasOrderChanged(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaLayerGroup /> Manage Categories
                        </h2>
                        <button onClick={onClose} className="text-white hover:text-indigo-200 transition-colors">
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {message.type === 'success' ? <FaCheck /> : null}
                                {message.text}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* List */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Existing Categories</h3>
                                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden max-h-96 overflow-y-auto">

                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={categories.map(c => c.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <ul className="divide-y divide-gray-200">
                                                {categories.length > 0 ? (
                                                    categories.map((cat) => (
                                                        <SortableCategoryItem
                                                            key={cat.id}
                                                            category={cat}
                                                        />
                                                    ))
                                                ) : (
                                                    <li className="p-4 text-center text-gray-500">No categories found.</li>
                                                )}
                                            </ul>
                                        </SortableContext>
                                    </DndContext>
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-500">Drag and drop to reorder categories.</p>
                                    {hasOrderChanged && (
                                        <button
                                            onClick={handleSaveOrder}
                                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                                        >
                                            Save Order
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Create Form */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
                                <form onSubmit={handleCreateCategory} className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={catName}
                                            onChange={(e) => setCatName(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                                            placeholder="e.g., Summer Sale"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={catDescription}
                                            onChange={(e) => setCatDescription(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none h-24 resize-none bg-white"
                                            placeholder="Description..."
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                                    >
                                        {isLoading ? 'Creating...' : 'Create Category'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SortableCategoryItemProps {
    category: CampaignCategory;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({ category }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`p-4 hover:bg-white transition-colors flex justify-between items-start bg-white ${isDragging ? 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50' : ''}`}
        >
            <div className="flex items-start gap-3 flex-1">
                <div
                    {...attributes}
                    {...listeners}
                    className="mt-1 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600"
                >
                    <FaBars />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.description}</p>
                </div>
            </div>
        </li>
    );
};

export default CampaignCategoriesModal;
