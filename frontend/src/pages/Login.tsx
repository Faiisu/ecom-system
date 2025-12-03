import React, { useState } from 'react';
import { FaArrowRight, FaEnvelope, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
            const response = await fetch(`${backendUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (response.ok) {
                // Handle success - e.g., store token, redirect to home
                // const data = await response.json();
                // localStorage.setItem('token', data.token);
                window.location.href = '/';
            } else {
                // Handle error
                const data = await response.json();
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-white">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
                {/* Animated Background Elements for Left Side */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                    <div className="absolute top-[40%] left-[60%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[100px] animate-bounce delay-700 duration-[5000ms]"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-xl">E</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-800 tracking-wide">E-Shop</span>
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
                        Welcome Back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">E-Shop</span>
                    </h1>
                </div>

                {/* Abstract 3D-like elements */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0">
                    <div className="absolute top-1/4 right-10 w-24 h-24 bg-gradient-to-br from-indigo-200 to-transparent rounded-2xl rotate-12 opacity-60 backdrop-blur-sm border border-white/40"></div>
                    <div className="absolute bottom-1/4 left-10 w-32 h-32 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-60 backdrop-blur-sm border border-white/40"></div>
                </div>

                <div className="relative z-10 flex gap-4 text-sm text-slate-500">
                    <span>© {new Date().getFullYear()} E-Shop</span>
                    <span>•</span>
                    <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
                    <span>•</span>
                    <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative z-10">
                <div className="max-w-md mx-auto w-full">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
                        <p className="text-slate-500">Enter your credentials to access your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 shadow-sm"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors font-medium">Forgot password?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaLock className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Sign In <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Create account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
