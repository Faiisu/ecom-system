import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUser, FaChevronDown, FaSignOutAlt, FaShoppingCart } from 'react-icons/fa';

const Navbar: React.FC = () => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">E-Shop</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            to="/campaign"
                            className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Campaign Manage
                        </Link>
                        <Link
                            to="/cart"
                            className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <FaShoppingCart className="text-lg" />
                            <span className="hidden sm:inline">Cart</span>
                        </Link>
                        {!isAuthPage && !localStorage.getItem('guestId') && (
                            <>
                                <Link
                                    to="/login"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                                >
                                    Login
                                </Link>
                            </>
                        )}
                        {localStorage.getItem('guestId') && (
                            <div className="relative group">
                                <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                                    <FaUser className="text-indigo-500" />
                                    <span>GUEST</span>
                                    <FaChevronDown className="text-xs text-indigo-400 group-hover:rotate-180 transition-transform duration-200" />
                                </button>

                                <div className="absolute right-0 top-full w-48 pt-2 hidden group-hover:block z-50">
                                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-200 origin-top-right">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    localStorage.removeItem('guestId');
                                                    window.location.reload();
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
                                            >
                                                <FaSignOutAlt />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
