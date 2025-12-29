
import React from 'react';
import { BookOpen, CheckSquare, BarChart3 } from 'lucide-react';

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
    return (
        <div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Enrolled Courses" value="0" icon={<BookOpen className="w-6 h-6" />} />
                <StatCard title="Completed Lessons" value="0" icon={<CheckSquare className="w-6 h-6" />} />
                <StatCard title="Average Quiz Score" value="N/A" icon={<BarChart3 className="w-6 h-6" />} />
            </div>

            <div className="flex items-center justify-center mt-12">
                 <button className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300">
                    Browse Available Courses
                </button>
            </div>
        </div>
    )
}

export default DashboardHome;
