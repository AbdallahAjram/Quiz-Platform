
import React from 'react';
import { BookOpen, Zap, BarChart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CourseCard = ({ title, description, category, difficulty, progress }: { title: string, description: string, category: string, difficulty: string, progress: number }) => {
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
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <p className="text-sm text-gray-500">{category}</p>
                    </div>
                </div>
                <p className="text-gray-600 mb-4">{description}</p>
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className={`font-semibold ${difficultyColor[difficulty] || 'text-gray-500'}`}>{difficulty}</span>
                </div>
                <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <button className="w-full mt-6 px-4 py-2 text-center font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Continue Learning
                </button>
            </div>
        </div>
    );
};


const MyCourses = () => {
    const navigate = useNavigate();
    const courses = [
        { title: "Web Development Basics", description: "An introduction to HTML, CSS, and JavaScript.", category: "Web Development", difficulty: "Beginner", progress: 75 },
        { title: "Advanced Laravel Patterns", description: "Master design patterns in Laravel for scalable apps.", category: "Backend Development", difficulty: "Advanced", progress: 40 },
        { title: "React UI Design", description: "Create beautiful and responsive UIs with React and Tailwind CSS.", category: "Frontend Development", difficulty: "Intermediate", progress: 60 },
    ];

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
                {courses.map(course => <CourseCard key={course.title} {...course} />)}
            </div>
        </div>
    );
};

export default MyCourses;
