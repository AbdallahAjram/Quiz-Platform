
import React, { useState, useEffect } from 'react';
import { BookOpen, CheckSquare, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-md">
        <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
    </div>
);

const DashboardHome = () => {
    const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
    const [completedLessonsCount, setCompletedLessonsCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const token = localStorage.getItem('token');
                const [enrolledCoursesResponse, completedLessonsResponse] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/student/enrolled-courses-count', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    axios.get('http://127.0.0.1:8000/api/student/completed-lessons-count', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                ]);
                setEnrolledCoursesCount(enrolledCoursesResponse.data.count);
                setCompletedLessonsCount(completedLessonsResponse.data.count);
            } catch (error) {
                console.error('Failed to fetch dashboard counts:', error);
            }
        };

        fetchCounts();
    }, []);

    return (
        <div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Enrolled Courses" value={enrolledCoursesCount.toString()} icon={<BookOpen className="w-6 h-6" />} />
                <StatCard title="Completed Lessons" value={completedLessonsCount.toString()} icon={<CheckSquare className="w-6 h-6" />} />
                <StatCard title="Average Quiz Score" value="N/A" icon={<BarChart3 className="w-6 h-6" />} />
            </div>

            <div className="flex items-center justify-center mt-12">
                 <Link to="/dashboard/courses/browse" className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300">
                    Browse Available Courses
                </Link>
            </div>
        </div>
    )
}

export default DashboardHome;
