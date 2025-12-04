import React, { useEffect, useState } from 'react';
import { FaShoppingBag, FaTrash, FaTag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CampaignSelectionModal from '../components/CampaignSelectionModal';

interface CartItem {
    _id: string;
    id: string;
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
}

interface Campaign {
    id: string;
    name: string;
    description: string;
    discount_type: string;
    discount_value: number;
    every?: number;
    limit?: number;
    is_active: boolean;
    campaign_category_id: string;
    product_categories: { id: string; name: string }[];
}

interface CampaignCategory {
    id: string;
    name: string;
    description: string;
    rank?: number;
}

const CartPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [categories, setCategories] = useState<CampaignCategory[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    useEffect(() => {
        const fetchData = async () => {
            const guestId = localStorage.getItem('guestId');
            if (!guestId) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch Cart
                const cartResponse = await fetch(`${backendUrl}/cart/${guestId}`);
                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    setCartItems(Array.isArray(cartData) ? cartData : []);
                }

                // Fetch Categories
                const categoriesResponse = await fetch(`${backendUrl}/campaign-categories`);
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                }

                // Fetch Campaigns
                const campaignsResponse = await fetch(`${backendUrl}/campaigns`);
                if (campaignsResponse.ok) {
                    const campaignsData = await campaignsResponse.json();
                    // Filter only active campaigns
                    const activeCampaigns = Array.isArray(campaignsData)
                        ? campaignsData.filter((c: Campaign) => c.is_active)
                        : [];
                    setCampaigns(activeCampaigns);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load cart data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.product_price * item.quantity), 0);
    };

    const handleDelete = async (productId: string) => {
        const guestId = localStorage.getItem('guestId');
        if (!guestId) return;

        if (!window.confirm('Are you sure you want to remove this item?')) return;

        try {
            const response = await fetch(`${backendUrl}/cart`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: guestId,
                    product_id: productId,
                }),
            });

            if (response.ok) {
                setCartItems(prev => prev.filter(item => item.product_id !== productId));
            } else {
                console.error('Failed to delete item');
                setError('Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            setError('Error deleting item');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!localStorage.getItem('guestId')) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <FaShoppingBag className="text-6xl text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Please sign in to view your cart</p>
                <Link to="/login" className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
                        <Link to="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div key={item._id || item.id} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-6">
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        <img
                                            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                            alt={item.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                                        <p className="text-indigo-600 font-medium">${item.product_price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                            <span className="text-lg font-bold text-gray-900 mt-1">
                                                ${(item.product_price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.product_id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove item"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>${calculateTotal().toFixed(2)}</span>
                                    </div>

                                    {/* Selected Campaigns */}
                                    {selectedCampaigns.length > 0 && (
                                        <div className="border-t border-gray-100 pt-4 space-y-2">
                                            <p className="text-sm font-medium text-gray-900">Applied Discounts:</p>
                                            {selectedCampaigns.map(camp => (
                                                <div key={camp.id} className="flex justify-between text-sm text-green-600">
                                                    <span>{camp.name}</span>
                                                    <span>
                                                        {camp.discount_type === 'percent' && `-${camp.discount_value}%`}
                                                        {camp.discount_type === 'fixed' && `-$${camp.discount_value}`}
                                                        {camp.discount_type === 'spendAndSave' && `Spend $${camp.every}, Save $${camp.discount_value}`}
                                                        {camp.discount_type === 'points' && `Points`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 pt-4 flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>${calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsCampaignModalOpen(true)}
                                    className="w-full mb-3 bg-indigo-50 text-indigo-700 py-3 rounded-xl font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaTag />
                                    {selectedCampaigns.length > 0 ? 'Manage Coupons' : 'Apply Coupon'}
                                </button>

                                <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CampaignSelectionModal
                isOpen={isCampaignModalOpen}
                onClose={() => setIsCampaignModalOpen(false)}
                campaigns={campaigns}
                categories={categories}
                onApply={setSelectedCampaigns}
                initialSelected={selectedCampaigns}
            />
        </div>
    );
};

export default CartPage;
