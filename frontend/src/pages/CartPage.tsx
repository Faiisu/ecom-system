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

interface Product {
    id: string;
    name: string;
    price: number;
    product_category_id: string;
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

interface ProductCategory {
    id: string;
    name: string;
}

const CartPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [categories, setCategories] = useState<CampaignCategory[]>([]);
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [discountData, setDiscountData] = useState<{ totalDiscount: number; breakdown: { id: string; name: string; amount: number }[] }>({ totalDiscount: 0, breakdown: [] });
    const [finalTotal, setFinalTotal] = useState(0);
    const [subtotal, setSubtotal] = useState(0);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    const getSubtotal = () => {
        const subtotal = cartItems.reduce((total, item) => total + (item.product_price * item.quantity), 0);
        return subtotal;
    };

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

                // Fetch Products (to get category info)
                const productsResponse = await fetch(`${backendUrl}/products`);
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setProducts(Array.isArray(productsData) ? productsData : []);
                }

                // Fetch Categories
                const categoriesResponse = await fetch(`${backendUrl}/campaign-categories`);
                if (categoriesResponse.ok) {
                    const categoriesData = await categoriesResponse.json();
                    setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                }

                // Fetch Product Categories
                const productCategoriesResponse = await fetch(`${backendUrl}/product-categories`);
                if (productCategoriesResponse.ok) {
                    const productCategoriesData = await productCategoriesResponse.json();
                    setProductCategories(Array.isArray(productCategoriesData) ? productCategoriesData : []);
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

    useEffect(() => {
        setSubtotal(getSubtotal());
        setFinalTotal(subtotal);
    }, [cartItems]);

    const calculateDiscount = (currentCampaigns: Campaign[], currentCartItems: CartItem[]) => {
        let totalDiscount = 0;
        const breakdown: { id: string; name: string; amount: number }[] = [];

        // Create a working copy with mutable current_price
        let workingItems = currentCartItems.map(item => ({
            ...item,
            current_unit_price: item.product_price
        }));

        currentCampaigns.forEach(campaign => {
            // 1. Identify eligible items for this campaign
            const eligibleIndices: number[] = [];

            workingItems.forEach((item, index) => {
                // If campaign has no specific product categories, it applies to all
                if (!campaign.product_categories || campaign.product_categories.length === 0) {
                    eligibleIndices.push(index);
                    return;
                }
                // Find product details to check category
                const product = products.find(p => p.id === item.product_id);
                if (!product) return;

                // Check if product's category is in the campaign's target list
                if (campaign.product_categories.some(pc => pc.id === product.product_category_id)) {
                    eligibleIndices.push(index);
                }
            });

            // 2. Calculate base amount from eligible items using CURRENT price
            const eligibleAmount = eligibleIndices.reduce((sum, index) => {
                const item = workingItems[index];
                return sum + (item.current_unit_price * item.quantity);
            }, 0);

            if (eligibleAmount > 0) {
                let discountAmount = 0;

                switch (campaign.discount_type) {
                    case 'fixed':
                        discountAmount = campaign.discount_value;
                        if (eligibleAmount < discountAmount) discountAmount = eligibleAmount;
                        break;
                    case 'percent':
                        discountAmount = (eligibleAmount * campaign.discount_value) / 100;
                        break;
                    case 'spendAndSave':
                        if (campaign.every && campaign.every > 0) {
                            const times = Math.floor(eligibleAmount / campaign.every);
                            discountAmount = times * campaign.discount_value;
                        }
                        break;
                    case 'points':
                        const guestPointsStr = localStorage.getItem('guestPoints');
                        let AvaliablePoint = guestPointsStr ? parseInt(guestPointsStr, 10) : 0;

                        if (campaign.limit !== undefined && (AvaliablePoint / subtotal) * 100 > campaign.limit) {
                            AvaliablePoint = campaign.limit * subtotal / 100;
                        }
                        discountAmount = AvaliablePoint;
                        break;
                }

                // Ensure discount doesn't exceed eligible amount
                discountAmount = Math.min(discountAmount, eligibleAmount);

                if (discountAmount > 0) {
                    totalDiscount += discountAmount;
                    breakdown.push({ id: campaign.id, name: campaign.name, amount: discountAmount });

                    // DISTRIBUTE DISCOUNT
                    const ratio = discountAmount / eligibleAmount;

                    eligibleIndices.forEach(index => {
                        const item = workingItems[index];
                        // Reduce price by ratio
                        item.current_unit_price = item.current_unit_price * (1 - ratio);
                    });
                }
            }
        });
        setFinalTotal(workingItems.reduce((sum, item) => sum + item.current_unit_price * item.quantity, 0));
        return { totalDiscount, breakdown };
    };

    const handleApplyCampaigns = (newSelectedCampaigns: Campaign[]) => {
        setSelectedCampaigns(newSelectedCampaigns);
        const result = calculateDiscount(newSelectedCampaigns, cartItems);
        setDiscountData(result);
        setIsCampaignModalOpen(false);
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

    const handleCheckout = () => {

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

    const getCategoryTotals = () => {
        const totals: Record<string, number> = {};

        cartItems.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                const category = productCategories.find(c => c.id === product.product_category_id);
                const categoryName = category ? category.name : 'Uncategorized';
                const itemTotal = item.product_price * item.quantity;
                totals[categoryName] = (totals[categoryName] || 0) + itemTotal;
            }
        });

        return Object.entries(totals).map(([name, total]) => ({ name, total }));
    };

    const { totalDiscount, breakdown } = discountData;
    const categoryTotals = getCategoryTotals();

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
                                        <p className="text-indigo-600 font-medium">฿{item.product_price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                            <span className="text-lg font-bold text-gray-900 mt-1">
                                                ฿{(item.product_price * item.quantity).toFixed(2)}
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
                                    {/* Category Totals */}
                                    <div className="space-y-2 pb-4 border-gray-100">
                                        {categoryTotals.map((cat) => (
                                            <div key={cat.name} className="flex justify-between text-gray-600 text-sm">
                                                <span>{cat.name}</span>
                                                <span>฿{cat.total.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>SubTotal</span>
                                        <span>฿{subtotal.toFixed(2)}</span>
                                    </div>

                                    {/* Selected Campaigns */}
                                    {breakdown.length > 0 && (
                                        <div className="border-t border-gray-100 pt-4 space-y-2">
                                            <p className="text-sm font-medium text-gray-900">Applied Discounts:</p>
                                            {breakdown.map(b => (
                                                <div key={b.id} className="flex justify-between text-sm text-green-600">
                                                    <span>{b.name}</span>
                                                    <span>-฿{b.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 pt-4 flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>฿{finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsCampaignModalOpen(true)}
                                    className="w-full mb-3 bg-indigo-50 text-indigo-700 py-3 rounded-xl font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaTag />
                                    {selectedCampaigns.length > 0 ? 'Manage Coupons' : 'Apply Coupon'}
                                </button>

                                <button onClick={() => handleCheckout()} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
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
                onApply={handleApplyCampaigns}
                initialSelected={selectedCampaigns}
                cartItems={cartItems}
                products={products}
                subtotal={subtotal}
            />
        </div>
    );
};

export default CartPage;
