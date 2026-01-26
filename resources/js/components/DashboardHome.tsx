import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MyCourses from './MyCourses';
import { BookOpen, CheckSquare, BarChart3, Loader2 } from 'lucide-react';

interface Stats {
    TotalCourses: number;
    TotalLessons: number;
    AverageScore: number | null;
}

const DashboardHome = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:8000/api/dashboard/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Enrolled Courses Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats?.TotalCourses ?? 0}</p>
                    </div>
                </div>

                {/* Completed Lessons Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <CheckSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Completed Lessons</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats?.TotalLessons ?? 0}</p>
                    </div>
                </div>

                {/* Average Quiz Score Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Average Quiz Score</p>
                        <p className="text-2xl font-semibold text-gray-900">
                            {stats?.AverageScore !== null && stats?.AverageScore !== undefined
                                ? `${Math.round(stats.AverageScore)}%`
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            <MyCourses />
        </div>
    )
}

export default DashboardHome;
