import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, BookOpen, Users, BarChart2 } from 'lucide-react';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-soft transition-transform transform hover:-translate-y-1">
        <div className="flex items-center">
            <div className={`p-3 rounded-full bg-opacity-20 ${color}`}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

interface Enrollment {
    Id: number;
    user: { Name: string };
    course: { Title: string };
    EnrolledAt: string;
}

const ManagementDashboard = () => {
    const [stats, setStats] = useState<{
        CourseCount: number;
        StudentCount: number;
        LessonCount: number;
        AverageQuizScore: number;
    } | null>(null);
    const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:8000/api/dashboard/stats', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                const { TotalCourses, TotalStudents, TotalLessons, AverageScore, RecentActivity } = response.data;
                setStats({
                    CourseCount: TotalCourses,
                    StudentCount: TotalStudents,
                    LessonCount: TotalLessons,
                    AverageQuizScore: AverageScore,
                });
                setRecentEnrollments(RecentActivity);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading || !stats) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Management Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard icon={<BookOpen size={24} />} label="Total Courses" value={stats.CourseCount} color="bg-blue-200 text-blue-600" />
                <StatCard icon={<Users size={24} />} label="Total Students" value={stats.StudentCount} color="bg-green-200 text-green-600" />
                <StatCard icon={<BarChart2 size={24} />} label="Total Lessons" value={stats.LessonCount} color="bg-yellow-200 text-yellow-600" />
                <StatCard icon={<Award size={24} />} label="Avg. Quiz Score" value={`${(stats.AverageQuizScore || 0).toFixed(1)}%`} color="bg-indigo-200 text-indigo-600" />
            </div>

            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="bg-white p-6 rounded-lg shadow-soft">
                    <ul className="divide-y divide-gray-200">
                        {recentEnrollments && recentEnrollments.length > 0 ? (
                            recentEnrollments.map(enrollment => (
                                <li key={enrollment.Id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            <span className="font-bold">{enrollment.user.Name}</span> enrolled in <span className="font-bold">{enrollment.course.Title}</span>
                                        </p>
                                        <p className="text-sm text-gray-500">{new Date(enrollment.EnrolledAt).toLocaleDateString()}</p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No recent enrollments.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ManagementDashboard;
