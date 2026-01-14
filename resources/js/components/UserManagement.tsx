import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import Toast from './Toast';
import { Plus, Loader2 } from 'lucide-react';

interface User {
    Id: number;
    Name: string;
    Email: string;
    Role: string;
    Status: string;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('All');

    const [newUser, setNewUser] = useState({
        Name: '',
        Email: '',
        Password: '',
        Role: 'Instructor', // Default role
    });

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId: number, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`http://127.0.0.1:8000/api/users/${userId}/status`, { Status: status }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setToast({ message: response.data.message, type: 'success' });
            setUsers(users.map(u => u.Id === userId ? response.data.user : u));
        } catch (error) {
            setToast({ message: `Failed to update user status.`, type: 'error' });
            console.error('Failed to update user status:', error);
        }
    };

    const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    const handleAddNewUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const userData = {
                ...newUser,
                Status: newUser.Role === 'Instructor' ? 'Pending' : 'Active',
            };
            await axios.post('http://127.0.0.1:8000/api/users', userData, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setIsModalOpen(false);
            setNewUser({ Name: '', Email: '', Password: '', Role: 'Instructor' }); // Reset form
            fetchUsers();
        } catch (error) {
            console.error('Failed to add new user:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'All') return true;
        return user.Status === filter;
    });

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-200 text-green-800';
            case 'Pending':
                return 'bg-yellow-200 text-yellow-800';
            case 'Revoked':
                return 'bg-red-200 text-red-800';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <div className="flex items-center">
                    <div className="flex space-x-2 mr-4">
                        <button onClick={() => setFilter('All')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
                        <button onClick={() => setFilter('Active')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'Active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Active</button>
                        <button onClick={() => setFilter('Pending')} className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'Pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Pending</button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New User
                    </button>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.Id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.Name}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.Email}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.Role}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(user.Status)}`}>
                                        {user.Status}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    {user.Status === 'Pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(user.Id, 'Active')}
                                                className="px-4 py-2 mr-2 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(user.Id, 'Revoked')}
                                                className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
                                            >
                                                Decline
                                            </button>
                                        </>
                                    ) : user.Status === 'Active' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(user.Id, 'Revoked')}
                                            className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
                                        >
                                            Revoke
                                        </button>
                                    ) : user.Status === 'Revoked' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(user.Id, 'Active')}
                                            className="px-4 py-2 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600"
                                        >
                                            Activate
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Add New User</h3>
                <form onSubmit={handleAddNewUser} className="mt-4 space-y-4">
                    <input
                        type="text"
                        name="Name"
                        placeholder="Name"
                        value={newUser.Name}
                        onChange={handleNewUserChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="email"
                        name="Email"
                        placeholder="Email"
                        value={newUser.Email}
                        onChange={handleNewUserChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="password"
                        name="Password"
                        placeholder="Password"
                        value={newUser.Password}
                        onChange={handleNewUserChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <select
                        name="Role"
                        value={newUser.Role}
                        onChange={handleNewUserChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="Instructor">Instructor</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Add User
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
