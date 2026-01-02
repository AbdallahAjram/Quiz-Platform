
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, BookOpen, Users, Percent } from 'lucide-react';

interface Stats {
    TotalCourses: number;
    TotalStudents: number;
    AverageQuizScore: number;
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="p-6 bg-white rounded-lg shadow-md flex items-center">
        <div className="p-3 bg-blue-500 rounded-full">
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const ManagementDashboard = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/management/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            setStats(response.data);
        } catch (err: any) {
            setError('Failed to fetch dashboard stats.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Management Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome to the management portal.</p>

            {loading && <Loader2 className="w-8 h-8 mt-4 animate-spin" />}
            {error && <div className="p-4 mt-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            {stats && (
                <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Total Courses" value={stats.TotalCourses} icon={BookOpen} />
                    <StatCard title="Total Students" value={stats.TotalStudents} icon={Users} />
                    <StatCard title="Quiz Average" value={`${stats.AverageQuizScore}%`} icon={Percent} />
                </div>
            )}
        </div>
    );
};

export default ManagementDashboard;
