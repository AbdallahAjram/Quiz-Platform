import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Award, Calendar } from 'lucide-react';

interface StudentStat {
    StudentName: string;
    Status: 'Completed' | 'Not Started';
    HighestScore: number | null;
    LastAttemptDate: string | null;
}

const QuizStudentStats = () => {
    const { quizId } = useParams();
    const [stats, setStats] = useState<StudentStat[]>([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchStudentStats = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/quizzes/${quizId}/students`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStats(response.data.stats);
                setQuizTitle(response.data.quizTitle);
            } catch (err) {
                setError('Failed to fetch student statistics.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentStats();
    }, [quizId, token]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Users className="animate-pulse" /></div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-6 bg-white text-gray-900 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Student Performance for: {quizTitle}</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Student Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Highest Score</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Last Attempt</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((stat, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-6 py-4 whitespace-nowrap">{stat.StudentName}</td>
                                <td className="px-6 py-4 whitespace-nowrap flex items-center">
                                    {stat.Status === 'Completed' ? <CheckCircle className="text-green-500 mr-2" /> : <XCircle className="text-red-500 mr-2" />}
                                    {stat.Status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {stat.HighestScore !== null ? `${stat.HighestScore}%` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {stat.LastAttemptDate ? new Date(stat.LastAttemptDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        disabled={stat.Status === 'Not Started'}
                                        onClick={() => navigate(`/management/quizzes/${quizId}/student/${stat.StudentName}/answers`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        View Detailed Answers
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuizStudentStats;
