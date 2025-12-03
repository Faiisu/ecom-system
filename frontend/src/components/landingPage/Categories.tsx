import React from 'react';

const categories = [
    {
        id: 1,
        name: 'Electronics',
        image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        count: '120+ Products'
    },
    {
        id: 2,
        name: 'Fashion',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        count: '350+ Products'
    },
    {
        id: 3,
        name: 'Home & Living',
        image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        count: '200+ Products'
    }
];

const Categories: React.FC = () => {
    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Shop by Category</h2>
                    <p className="mt-4 text-lg text-gray-600">Explore our wide range of collections</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {categories.map((category) => (
                        <div key={category.id} className="relative group rounded-2xl overflow-hidden shadow-md cursor-pointer h-80">
                            <img
                                src={category.image}
                                alt={category.name}
                                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300"></div>
                            <div className="absolute bottom-0 left-0 p-8 w-full">
                                <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                                <p className="text-gray-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                    {category.count}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;
