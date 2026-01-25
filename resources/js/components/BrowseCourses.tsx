import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from './Toast';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';

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