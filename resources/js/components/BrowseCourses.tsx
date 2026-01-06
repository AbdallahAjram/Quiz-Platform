import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from './Toast';
import { Link } from 'react-router-dom';

interface Course {
    Id: number;
    Title: string;
    ShortDescription: string;
    Category: string;
    Difficulty: string;
    IsEnrolled: boolean;
    instructor: {
        Name: string;
    };
    first_lesson_id: number | null;
}

const CourseCard = ({ course, onEnroll }: { course: Course, onEnroll: (courseId: number) => void }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col">
            <div className="flex-grow">
                <h2 className="text-xl font-bold mb-2">{course.Title}</h2>
                <p className="text-gray-700 mb-4">{course.ShortDescription}</p>
                {course.instructor && (
                    <p className="text-sm text-gray-500 mb-4">Taught by: {course.instructor.Name}</p>
                )}
            </div>
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-gray-600">{course.Category}</span>
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${
                    course.Difficulty === 'Beginner' ? 'bg-green-500' :
                    course.Difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                    {course.Difficulty}
                </span>
            </div>
            <div className="mt-auto">
                {course.IsEnrolled ? (
                     <Link
                        to={`/courses/${course.Id}/lessons/${course.first_lesson_id}`}
                        className="block w-full text-center py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Continue Learning
                    </Link>
                ) : (
                    <button
                        onClick={() => onEnroll(course.Id)}
                        className="w-full py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                        Enroll Now
                    </button>
                )}
            </div>
        </div>
    );
};

const BrowseCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fetchAvailableCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/student/available-courses', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCourses(response.data);
        } catch (error) {
            setToast({ message: 'Failed to fetch courses.', type: 'error' });
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

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length > 0 ? (
                    courses.map(course => (
                        <CourseCard key={course.Id} course={course} onEnroll={handleEnroll} />
                    ))
                ) : (
                    <p>No courses are currently available for enrollment.</p>
                )}
            </div>
        </div>
    );
};

export default BrowseCourses;