import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface Quiz {
    Id: number;
    Title: string;
    CourseTitle: string;
    attempts_count: number;
}

const QuizManagement = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/quizzes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.length === 0) {
                    console.log('No quizzes found. API response:', response);
                }
                setQuizzes(response.data);
            } catch (err) {
                setError('Failed to fetch quizzes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, [token]);

    const handleQuizClick = (quizId: number) => {
        navigate(`/management/quizzes/${quizId}/students`);
    };

    if (loading) {
        return <div>Loading quizzes...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Quiz Management</h1>
            <div className="bg-white shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quiz Title
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Associated Course
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Attempts
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">View</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quizzes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No quizzes found.
                                </td>
                            </tr>
                        ) : (
                            quizzes.map((quiz) => (
                                <tr key={quiz.Id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleQuizClick(quiz.Id)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quiz.Title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quiz.CourseTitle || 'No Course Assigned'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quiz.attempts_count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900">
                                            <Eye className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuizManagement;
