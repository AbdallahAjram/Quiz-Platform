import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Book, BrainCircuit, BarChart, Users, LogOut, PlusCircle } from 'lucide-react';

const ManagementLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const sidebarLinks = [
        { name: 'Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
        { name: 'Courses', path: '/management/courses', icon: Book },
        { name: 'Lessons', path: '/management/lessons', icon: BrainCircuit },
        { name: 'Quizzes', path: '/management/quizzes', icon: BrainCircuit },
        { name: 'Analytics', path: '/management/analytics', icon: BarChart },
    ];

    if (user.Role === 'Admin') {
        sidebarLinks.push({ name: 'User Management', path: '/management/users', icon: Users });
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white">Management</h1>
                </div>
                <nav className="mt-6">
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            end
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
                        <span className="mr-4">Welcome, {user.name} ({user.Role})</span>
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