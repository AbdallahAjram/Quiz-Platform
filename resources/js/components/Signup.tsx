
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [Role, setRole] = useState('Student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!name || !email || !password) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/auth/register', {
                Name: name,
                Email: email,
                Password: password,
                Role,
            }, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status === 200 || response.status === 201) {
                setSuccess('Success! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.data && err.response.data.errors) {
                const errorMessages = Object.values(err.response.data.errors).flat().join(' ');
                setError(errorMessages);
            }
            else {
                setError('Could not create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
                    <p className="text-gray-500">Join Quizify today!</p>
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
                        <User className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full py-3 pl-10 pr-4 text-gray-700 bg-gray-100 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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

                    <div className="relative">
                         <User className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
                        <select
                            className="w-full py-3 pl-10 pr-4 text-gray-700 bg-gray-100 border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={Role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="Student">Student</option>
                            <option value="Instructor">Instructor</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
