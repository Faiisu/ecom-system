import React, { useState } from 'react';
import FeaturedProducts from '../components/landingPage/FeaturedProducts';
import Footer from '../components/landingPage/footer';
import CreateProduct from './CreateProduct';
import { FaPlus } from 'react-icons/fa';

const LandingPage: React.FC = () => {
    const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col relative">
            <FeaturedProducts />
            <Footer />

            {/* Floating Action Button for Create Product */}
            <button
                onClick={() => setIsCreateProductOpen(true)}
                className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-110 z-40 flex items-center justify-center group"
                title="Create New Product"
            >
                <FaPlus className="text-xl" />
                <span className="ml-2">Add Product</span>
            </button>

            <CreateProduct isOpen={isCreateProductOpen} onClose={() => setIsCreateProductOpen(false)} />
        </div>
    );
};

export default LandingPage;
