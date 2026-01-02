import React from 'react';
import { useNavigate, NavLink as RouterNavLink, Outlet, Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, User, LogOut, Menu, X, Home } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');


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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const SidebarLink = ({ to, icon, children }: { to:string, icon: React.ReactNode, children: React.ReactNode }) => (
        <RouterNavLink
            to={to}
            end // Match the link exactly
            className={({ isActive }) =>
                `flex items-center px-4 py-2 text-gray-100 rounded-lg ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`
            }
        >
            {icon}
            <span className="ml-3">{children}</span>
        </RouterNavLink>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 px-4 py-8 overflow-y-auto bg-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                <Link to="/student/dashboard" className="text-3xl font-semibold text-center text-white">Quiz Platform</Link>
                <nav className="mt-10">
                    <SidebarLink to="/student/dashboard" icon={<Home className="w-5 h-5" />}>Dashboard</SidebarLink>
                    <SidebarLink to="courses" icon={<BookOpen className="w-5 h-5" />}>My Courses</SidebarLink>
                    <SidebarLink to="profile" icon={<User className="w-5 h-5" />}>Profile</SidebarLink>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white border-b">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none md:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-4">Welcome, {user.name}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                   <Outlet />
                </main>
            </div>
             {sidebarOpen && <div className="fixed inset-0 z-20 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>}
        </div>
    );
};

export default Dashboard;
