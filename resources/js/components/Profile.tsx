import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Mail, Shield } from 'lucide-react';

interface UserProfile {
    Name: string;
    Email: string;
    Role: string;
}

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:8000/api/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
            } catch (err) {
                setError('Failed to fetch profile data. Please try again later.');
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    if (!user) {
        return <div className="text-center text-gray-500">Loading profile...</div>;
    }

    const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
        <div className="flex items-center p-4 border-b">
            <div className="mr-4 text-gray-500">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-lg text-gray-900">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
            <div className="p-6 border-b-2 border-blue-500">
                <h2 className="text-3xl font-bold text-gray-800 text-center">My Profile</h2>
            </div>
            <div className="p-4">
                <DetailItem icon={<User className="w-6 h-6" />} label="Full Name" value={user.Name} />
                <DetailItem icon={<Mail className="w-6 h-6" />} label="Email Address" value={user.Email} />
                <DetailItem icon={<Shield className="w-6 h-6" />} label="Account Role" value={user.Role} />
            </div>
        </div>
    );
};

export default Profile;
