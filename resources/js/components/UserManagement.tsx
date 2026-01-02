
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import Modal from './Modal';
import Toast from './Toast';

interface User {
    id: number;
    name: string;
    email: string;
    Role: string;
    Status: string;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newInstructor, setNewInstructor] = useState({ name: '', email: '', password: '' });
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fetchPendingInstructors = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/admin/pending-instructors', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            setUsers(response.data);
        } catch (err: any) {
            setError('Failed to fetch pending instructors.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingInstructors();
    }, []);

    const handleApprove = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://127.0.0.1:8000/api/admin/users/${userId}/approve`, {}, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUsers(users.filter(user => user.id !== userId));
            setToast({ message: `User approved successfully.`, type: 'success' });
        } catch (err: any) {
            setToast({ message: `Failed to approve user.`, type: 'error' });
        }
    };

    const handleReject = async (userId: number) => {
        if (window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://127.0.0.1:8000/api/admin/users/${userId}/reject`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUsers(users.filter(user => user.id !== userId));
                setToast({ message: `User rejected successfully.`, type: 'success' });
            } catch (err: any) {
                setToast({ message: `Failed to reject user.`, type: 'error' });
            }
        }
    };

    const handleCreateInstructor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:8000/api/admin/create-instructor', newInstructor, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setIsModalOpen(false);
            setNewInstructor({ name: '', email: '', password: '' });
            setToast({ message: 'Instructor created successfully.', type: 'success' });
            // Optionally, refetch all users or just add the new one to the list
        } catch (err: any) {
            setToast({ message: 'Failed to create instructor.', type: 'error' });
        }
    };

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-2 text-gray-600">Approve pending instructor accounts.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Add New Instructor
                </button>
            </div>

            {loading && <Loader2 className="w-8 h-8 mt-4 animate-spin" />}
            {error && <div className="p-4 mt-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            <div className="mt-6">
                {users.length > 0 ? (
                    <ul className="space-y-4">
                        {users.map(user => (
                            <li key={user.id} className="p-4 bg-white rounded-lg shadow-lg flex justify-between items-center transform hover:-translate-y-1 transition-transform duration-300">
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        className="flex items-center px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600"
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(user.id)}
                                        className="flex items-center px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
                                    >
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !loading && <p className="mt-6 text-center text-gray-500">No pending instructor requests at the moment.</p>
                )}
            </div>

            <Modal title="Add New Instructor" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleCreateInstructor}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="w-full px-4 py-2 border rounded-md"
                            value={newInstructor.name}
                            onChange={e => setNewInstructor({ ...newInstructor, name: e.target.value })}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-4 py-2 border rounded-md"
                            value={newInstructor.email}
                            onChange={e => setNewInstructor({ ...newInstructor, email: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-2 border rounded-md"
                            value={newInstructor.password}
                            onChange={e => setNewInstructor({ ...newInstructor, password: e.target.value })}
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Create Instructor
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;
