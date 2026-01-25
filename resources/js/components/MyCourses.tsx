import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/enrollments/my-courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCourses(response.data || []);
            } catch (error)
            {
                console.error('Failed to fetch courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">My Current Courses</h1>
            {courses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <CourseCard key={course.Id} course={course} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-gray-600 text-lg mb-4">You are not enrolled in any courses yet.</p>
                    <Link to="/dashboard/courses/browse" className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Browse Courses
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MyCourses;