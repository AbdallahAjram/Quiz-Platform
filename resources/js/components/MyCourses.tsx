
import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, BarChart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Course {
    Id: number;
    Title: string;
    Description: string;
    Category: string;
    Difficulty: string;
    IsPublished: boolean;
    CreatedBy: number;
}

const CourseCard = ({ course, onTogglePublish }: { course: Course, onTogglePublish: (courseId: number, isPublished: boolean) => void }) => {
    const difficultyColor = {
        Beginner: 'text-green-500',
        Intermediate: 'text-yellow-500',
        Advanced: 'text-red-500',
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{course.Title}</h3>
                        <p className="text-sm text-gray-500">{course.Category}</p>
                    </div>
                </div>
                <p className="text-gray-600 mb-4">{course.Description}</p>
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className={`font-semibold ${difficultyColor[course.Difficulty] || 'text-gray-500'}`}>{course.Difficulty}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${course.IsPublished ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                        {course.IsPublished ? 'Published' : 'Draft'}
                    </span>
                </div>
                <button 
                    onClick={() => onTogglePublish(course.Id, !course.IsPublished)}
                    className="w-full mt-6 px-4 py-2 text-center font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
                >
                    {course.IsPublished ? 'Unpublish' : 'Publish'}
                </button>
            </div>
        </div>
    );
};


const MyCourses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:8000/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                
                if (user.Role === 'Admin') {
                    setCourses(response.data);
                } else {
                    setCourses(response.data.filter(course => course.CreatedBy === user.Id));
                }
                
            } catch (error) {
                console.error('Failed to fetch courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user.Id, user.Role]);

    const handleTogglePublish = async (courseId: number, isPublished: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://127.0.0.1:8000/api/courses/${courseId}/publish`, { IsPublished: isPublished }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCourses(courses.map(c => c.Id === courseId ? { ...c, IsPublished: isPublished } : c));
        } catch (error) {
            console.error('Failed to toggle publish status:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
                <button
                    onClick={() => navigate('/management/courses/create')}
                    className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Course
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => <CourseCard key={course.Id} course={course} onTogglePublish={handleTogglePublish} />)}
            </div>
        </div>
    );
};

export default MyCourses;
