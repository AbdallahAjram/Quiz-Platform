
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!email || !password) {
            setError('Email and password are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/auth/login',
                { email, password },
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.data.token && response.data.user) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setSuccess('Login successful! Redirecting to dashboard...');
                setTimeout(() => {
                    const user = response.data.user;
                    if (user.Role === 'Student') {
                        navigate('/student/dashboard');
                    } else if (user.Role === 'Instructor' || user.Role === 'Admin') {
                        navigate('/management/dashboard');
                    } else {
                        navigate('/dashboard'); // Fallback
                    }
                }, 2000);
            } else {
                 setError('Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.errors) {
                const errors = err.response.data.errors;
                const firstErrorKey = Object.keys(errors)[0];
                setError(errors[firstErrorKey][0]);
            } else if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Academy Login</h1>
                    <p className="text-gray-500">Welcome back! Please enter your details.</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                        {success}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="relative">
                        <Mail className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full py-3 pl-10 pr-4 text-gray-700 bg-gray-100 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full py-3 pl-10 pr-4 text-gray-700 bg-gray-100 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!success}
                        className="w-full py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
