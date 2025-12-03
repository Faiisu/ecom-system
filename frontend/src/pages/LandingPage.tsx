import React from 'react';
import FeaturedProducts from '../components/landingPage/FeaturedProducts';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <FeaturedProducts />
        </div>
    );
};

export default LandingPage;
