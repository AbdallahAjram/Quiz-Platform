import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import axios from 'axios';

interface Course {
    Id: number;
    Title: string;
    ShortDescription: string;
    Category: string;
    Difficulty: string;
}


const CourseCard = ({ course }: { course: Course }) => {
    const difficultyColor: Record<string, string> = {
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
                <p className="text-gray-600 mb-4 h-12 overflow-hidden">{course.ShortDescription}</p>
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className={`font-semibold ${difficultyColor[course.Difficulty] || 'text-gray-500'}`}>{course.Difficulty}</span>
                </div>
                <Link to={`/courses/${course.Id}/lessons`} className="w-full mt-6 px-4 py-2 text-center font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    View Course
                </Link>
            </div>
        </div>
    );
};

const MyCourses = () => {
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchEnrolledCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/enrollments/my-courses', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch enrolled courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your courses...</div>;
    if (!courses) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Learning</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => <CourseCard key={course.Id} course={course} />)}
            </div>
        </div>
    );
};

export default MyCourses;