import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Book, BrainCircuit, BarChart, Users, LogOut, User, Award } from 'lucide-react';

const ManagementLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    const handleLogout = async () => {
        try {
            await axios.post('http://127.0.0.1:8000/api/auth/logout', {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    const sidebarLinks = [
        { name: 'Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
        { name: 'Courses', path: '/management/courses', icon: Book },
        { name: 'Quizzes', path: '/management/quizzes', icon: BrainCircuit },
        { name: 'Analytics', path: '/management/analytics', icon: BarChart },
        { name: 'Users', path: '/management/users', icon: Users },
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'Certificates', path: '/certificates', icon: Award }
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-gray-800">
                <div className="flex items-center justify-center h-16 bg-gray-900">
                    <span className="text-white font-bold uppercase">Academy</span>
                </div>
                <nav className="mt-6">
                    {sidebarLinks
                        .filter(link => user.Role === 'Admin' || link.name !== 'Users')
                        .map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            className={({ isActive }) =>
                                `flex items-center px-6 py-3 text-gray-100 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
                            }
                        >
                            <link.icon className="w-6 h-6" />
                            <span className="mx-3">{link.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1">
                {/* Header */}
                <header className="flex items-center justify-between p-6 bg-white border-b">
                    <div></div>
                    <div className="flex items-center">
                        <span className="mr-4">Welcome, {user.Name} ({user.Role})</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    </div>
                </header>
                {/* Content */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ManagementLayout;
