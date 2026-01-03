import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { Edit, Trash } from 'lucide-react';

interface Course {
    Id: number;
    Title: string;
    ShortDescription: string;
    Category: string;
    Difficulty: string;
    CreatedBy: number;
    IsPublished: boolean;
    instructor?: {
        Id: number;
        Name: string;
    };
}


const CourseCard = ({ course, user, onTogglePublish, onDelete }: { course: Course, user: any, onTogglePublish: (courseId: number, isPublished: boolean) => void, onDelete: (courseId: number) => void }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/management/courses/${course.Id}/lessons`);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 cursor-pointer" onClick={handleCardClick}>
            <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold mb-2">{course.Title}</h2>
                {(user.Role === 'Admin' || user.Id === course.CreatedBy) && (
                    <div className="flex space-x-2">
                        <Link to={`/management/courses/edit/${course.Id}`} onClick={(e) => e.stopPropagation()} className="p-1 text-gray-500 hover:text-gray-700">
                            <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(course.Id); }} className="p-1 text-red-500 hover:text-red-700">
                            <Trash className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-700 mb-2">{course.ShortDescription}</p>
            {user.Role === 'Admin' && course.instructor && (
                <p className="text-xs text-gray-500 mb-2">
                    Taught by: {course.instructor.Name}
                </p>
            )}
            <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-600">{course.Category}</span>
                <span className={`px-2 py-1 font-semibold text-white rounded-full ${
                    course.Difficulty === 'Beginner' ? 'bg-green-500' :
                    course.Difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                    {course.Difficulty}
                </span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
                <span className={`px-2 py-1 font-semibold rounded-full ${course.IsPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {course.IsPublished ? 'Published' : 'Draft'}
                </span>
                {(user.Role === 'Admin' || user.Id === course.CreatedBy) && (
                     <button
                        onClick={(e) => { e.stopPropagation(); onTogglePublish(course.Id, !course.IsPublished); }}
                        className={`px-2 py-1 font-semibold rounded-full ${course.IsPublished ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        {course.IsPublished ? 'Unpublish' : 'Publish'}
                    </button>
                )}
            </div>
        </div>
    );
};

const CourseManagement = () => {
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/courses', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCourses(response.data);
        } catch (error) {
            setToast({ message: 'Failed to fetch courses.', type: 'error' });
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleTogglePublish = async (courseId: number, isPublished: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://127.0.0.1:8000/api/courses/${courseId}/publish`,
                { IsPublished: isPublished },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setCourses(prev => prev!.map(c => c.Id === courseId ? { ...c, IsPublished: isPublished } : c));
            setToast({ message: `Course ${isPublished ? 'published' : 'unpublished'} successfully!`, type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to toggle publish status.', type: 'error' });
        }
    };

    const handleDelete = async (courseId: number) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://127.0.0.1:8000/api/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setCourses(prev => prev!.filter(c => c.Id !== courseId));
                setToast({ message: 'Course deleted successfully!', type: 'success' });
            } catch (error) {
                setToast({ message: 'Failed to delete course.', type: 'error' });
            }
        }
    };

    if (!courses) return null;

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                <Link
                    to="/management/courses/create"
                    className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    Create New Course
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <CourseCard key={course.Id} course={course} user={user} onTogglePublish={handleTogglePublish} onDelete={handleDelete} />
                ))}
            </div>
        </div>
    );
};

export default CourseManagement;