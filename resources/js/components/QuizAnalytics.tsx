import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, BrainCircuit } from 'lucide-react';

interface QuizAnalytic {
    QuizId: number;
    QuizTitle: string;
    CourseName: string;
    AttemptCount: number;
}

const QuizAnalytics = () => {
    const [analytics, setAnalytics] = useState<QuizAnalytic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/quizzes/analytics', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAnalytics(response.data);
            } catch (err) {
                setError('Failed to fetch quiz analytics.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [token]);

    const handleQuizClick = (quizId: number) => {
        navigate(`/management/quizzes/${quizId}/students`);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><BarChart className="animate-pulse" /></div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-6 flex items-center"><BrainCircuit className="mr-3" /> Quiz Analytics</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 border border-gray-700 rounded-lg">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Quiz Title</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Course</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Attempt Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.map((quiz) => (
                            <tr
                                key={quiz.QuizId}
                                onClick={() => handleQuizClick(quiz.QuizId)}
                                className="hover:bg-gray-700 cursor-pointer border-b border-gray-700"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">{quiz.QuizTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{quiz.CourseName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{quiz.AttemptCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuizAnalytics;