import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaTag } from 'react-icons/fa';

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

interface CampaignSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaigns: Campaign[];
    categories: CampaignCategory[];
    onApply: (selected: Campaign[]) => void;
    initialSelected: Campaign[];
    cartItems: CartItem[];
    products: Product[];
    subtotal: number;
}

const CampaignSelectionModal: React.FC<CampaignSelectionModalProps> = ({ isOpen, onClose, campaigns, categories, onApply, initialSelected }) => {
    const [selected, setSelected] = useState<Campaign[]>(initialSelected);

    useEffect(() => {
        if (isOpen) {
            setSelected(initialSelected);
        }
    }, [isOpen, initialSelected]);

    const toggleCampaign = (campaign: Campaign) => {
        const isSelected = selected.find(c => c.id === campaign.id);

        if (isSelected) {
            setSelected(selected.filter(c => c.id !== campaign.id));
        } else {
            // Check for category conflict
            const conflictingCampaign = selected.find(c => c.campaign_category_id === campaign.campaign_category_id);

            if (conflictingCampaign) {
                // Replace the conflicting campaign with the new one
                const newSelected = selected.filter(c => c.id !== conflictingCampaign.id);
                setSelected([...newSelected, campaign]);
            } else {
                setSelected([...selected, campaign]);
            }
        }
    };

    const handleApply = () => {
        // Sort selected campaigns by category rank before applying
        const sortedSelected = [...selected].sort((a, b) => {
            const catA = categories.find(c => c.id === a.campaign_category_id);
            const catB = categories.find(c => c.id === b.campaign_category_id);
            return (catA?.rank || 0) - (catB?.rank || 0);
        });
        onApply(sortedSelected);
        onClose();
    };


    // Group campaigns by category
    const campaignsByCategory = campaigns.reduce((acc, campaign) => {
        const categoryId = campaign.campaign_category_id;
        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(campaign);
        return acc;
    }, {} as Record<string, Campaign[]>);

    // Sort categories by rank (low to high)
    const sortedCategories = [...categories].sort((a, b) => {
        const rankA = a.rank !== undefined ? a.rank : 0;
        const rankB = b.rank !== undefined ? b.rank : 0;
        return rankA - rankB;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                                <FaTag className="text-indigo-600" /> Select Campaigns
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                            {campaigns.length > 0 ? (
                                <>
                                    {sortedCategories.map(category => {
                                        const categoryCampaigns = campaignsByCategory[category.id];
                                        if (!categoryCampaigns || categoryCampaigns.length === 0) return null;

                                        return (
                                            <div key={category.id}>
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
                                                    {category.name}
                                                </h4>
                                                <div className="space-y-3">
                                                    {categoryCampaigns.map(campaign => {
                                                        const isSelected = selected.some(c => c.id === campaign.id);
                                                        const isConflicting = !isSelected && selected.some(c => c.campaign_category_id === campaign.campaign_category_id);

                                                        return (
                                                            <div
                                                                key={campaign.id}
                                                                onClick={() => toggleCampaign(campaign)}
                                                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                                    ? 'border-indigo-600 bg-indigo-50'
                                                                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                                            {campaign.name}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                {campaign.discount_type === 'percent' && `${campaign.discount_value}% Off`}
                                                                                {campaign.discount_type === 'fixed' && `฿${campaign.discount_value} Off`}
                                                                                {campaign.discount_type === 'points' && `Points (Limit: ${campaign.limit || 0}%)`}
                                                                                {campaign.discount_type === 'spendAndSave' && `Spend ฿${campaign.every}, Save ฿${campaign.discount_value}`}
                                                                            </span>
                                                                            {isConflicting && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                    Replaces current selection
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="flex-shrink-0 text-indigo-600">
                                                                            <FaCheck className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Handle campaigns with unknown categories */}
                                    {Object.keys(campaignsByCategory).map(catId => {
                                        if (categories.find(c => c.id === catId)) return null;
                                        const unknownCampaigns = campaignsByCategory[catId];

                                        return (
                                            <div key={catId}>
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
                                                    Other Campaigns
                                                </h4>
                                                <div className="space-y-3">
                                                    {unknownCampaigns.map(campaign => {
                                                        const isSelected = selected.some(c => c.id === campaign.id);
                                                        const isConflicting = !isSelected && selected.some(c => c.campaign_category_id === campaign.campaign_category_id);

                                                        return (
                                                            <div
                                                                key={campaign.id}
                                                                onClick={() => toggleCampaign(campaign)}
                                                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                                    ? 'border-indigo-600 bg-indigo-50'
                                                                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                                            {campaign.name}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                {campaign.discount_type === 'percent' && `${campaign.discount_value}% Off`}
                                                                                {campaign.discount_type === 'fixed' && `฿${campaign.discount_value} Off`}
                                                                                {campaign.discount_type === 'points' && `Points (Limit: ${campaign.limit || 0}%)`}
                                                                                {campaign.discount_type === 'spendAndSave' && `Spend ฿${campaign.every}, Save ฿${campaign.discount_value}`}
                                                                            </span>
                                                                            {isConflicting && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                    Replaces current selection
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <div className="flex-shrink-0 text-indigo-600">
                                                                            <FaCheck className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <p className="text-center text-gray-500 py-4">No active campaigns available.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleApply}
                            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Apply Selected
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignSelectionModal;
