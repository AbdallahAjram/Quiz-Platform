import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { Plus, Loader2 } from 'lucide-react';

interface User {
    Id: number;
    Name: string;
    Email: string;
    Role: string;
    IsActive: boolean;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newUser, setNewUser] = useState({
        Name: '',
        Email: '',
        Password: '',
        Role: 'Instructor', // Default role
    });

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

    const handleApprove = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://127.0.0.1:8000/api/admin/users/${userId}/approve`, {}, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to approve user:', error);
        }
    };

    const handleReject = async (userId: number) => {
        if (window.confirm('Are you sure you want to reject and delete this user?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://127.0.0.1:8000/api/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                fetchUsers();
            } catch (error) {
                console.error('Failed to reject user:', error);
            }
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
                IsActive: newUser.Role === 'Admin', // Admins are active by default, instructors are not
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New User
                </button>
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
                        {users.map(user => (
                            <tr key={user.Id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.Name}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.Email}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{user.Role}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.IsActive ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                        {user.IsActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    {user.Role === 'Instructor' && !user.IsActive && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(user.Id)}
                                                className="px-4 py-2 mr-2 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.Id)}
                                                className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
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
