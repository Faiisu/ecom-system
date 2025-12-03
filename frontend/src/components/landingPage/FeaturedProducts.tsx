import React from 'react';

const products = [
    {
        id: 1,
        name: 'Wireless Noise-Canceling Headphones',
        price: '$299.99',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Electronics'
    },
    {
        id: 2,
        name: 'Premium Smart Watch',
        price: '$199.99',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Accessories'
    },
    {
        id: 3,
        name: 'Ergonomic Office Chair',
        price: '$349.99',
        image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Furniture'
    },
    {
        id: 4,
        name: 'Mechanical Keyboard',
        price: '$129.99',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        category: 'Electronics'
    }
];

const FeaturedProducts: React.FC = () => {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Featured Products</h2>
                    <p className="mt-4 text-lg text-gray-600">Hand-picked items just for you</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 group-hover:opacity-90 transition-opacity h-64">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-indigo-600 font-medium mb-1">{product.category}</p>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xl font-bold text-gray-900">{product.price}</span>
                                    <button className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
