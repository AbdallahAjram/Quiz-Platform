import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from './Toast';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';
import { Search } from 'lucide-react';

interface Course {
    Id: number;
    Title: string;
    ShortDescription: string;
    Category: string;
    Difficulty: string;
    IsEnrolled: boolean;
    Instructor: {
        Name: string;
    };
    FirstLessonId: number | null;
    ProgressPercentage?: number;
}

const BrowseCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAvailableCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/student/available-courses', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCourses(response.data || []);
        } catch (error) {
            setToast({ message: 'Failed to fetch courses.', type: 'error' });
            setCourses([]); // Ensure courses is an array even on error
        }
    };

    useEffect(() => {
        fetchAvailableCourses();
    }, []);

    const handleEnroll = async (courseId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:8000/api/enrollments', { CourseId: courseId }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setToast({ message: 'Enrolled successfully!', type: 'success' });
            fetchAvailableCourses(); // Refresh the course list
        } catch (error) {
            setToast({ message: 'Failed to enroll. Please try again.', type: 'error' });
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesFilter = filter === 'All' || course.Difficulty === filter;
        const matchesSearch = course.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              course.Category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
                
                <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                    {/* Filter Buttons */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                        <button 
                            onClick={() => setFilter('All')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors duration-200 ${filter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilter('Beginner')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors duration-200 ${filter === 'Beginner' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Beginner
                        </button>
                        <button 
                            onClick={() => setFilter('Intermediate')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors duration-200 ${filter === 'Intermediate' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Intermediate
                        </button>
                        <button 
                            onClick={() => setFilter('Advanced')} 
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors duration-200 ${filter === 'Advanced' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Advanced
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <CourseCard key={course.Id} course={course} onEnroll={handleEnroll} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
                        <button 
                            onClick={() => { setFilter('All'); setSearchQuery(''); }}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseCourses;