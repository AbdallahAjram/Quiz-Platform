import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import Modal from './Modal';

interface StudentStat {
    UserId: number;
    StudentName: string;
    Status: 'Completed' | 'Not Started';
    HighestScore: number | null;
    LastAttemptDate: string | null;
    LastAttemptId: number | null;
}

interface AnswerOption {
    Id: number;
    AnswerText: string;
}

interface AttemptQuestion {
    QuestionId: number;
    QuestionText: string;
    AnswerOptions: AnswerOption[];
    UserAnswerId: number | null;
    CorrectAnswerId: number | null;
}

interface AttemptDetails {
    QuizTitle: string;
    AttemptScore: number;
    AttemptDate: string;
    Questions: AttemptQuestion[];
}

const QuizStudentStats = () => {
    const { quizId } = useParams();
    const [stats, setStats] = useState<StudentStat[]>([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<AttemptDetails | null>(null);
    const [loadingModal, setLoadingModal] = useState(false);

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

    const handleViewDetailsClick = async (attemptId: number) => {
        if (!attemptId) return;
        setLoadingModal(true);
        setIsModalOpen(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/attempts/${attemptId}/details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSelectedAttemptDetails(response.data);
        } catch (err) {
            console.error('Failed to fetch attempt details', err);
            setError('Failed to load attempt details.');
        } finally {
            setLoadingModal(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Users className="animate-pulse" /></div>;
    }

    if (error && !isModalOpen) {
        return <div className="text-red-500">{error}</div>;
    }

    const renderAnswerOption = (option: AnswerOption, question: AttemptQuestion) => {
        const isUserAnswer = option.Id === question.UserAnswerId;
        const isCorrectAnswer = option.Id === question.CorrectAnswerId;
        let className = "p-2 rounded ";

        if (isUserAnswer && isCorrectAnswer) {
            className += "bg-green-200 border-green-500";
        } else if (isUserAnswer && !isCorrectAnswer) {
            className += "bg-red-200 border-red-500";
        } else if (isCorrectAnswer) {
            className += "bg-green-100";
        } else {
            className += "bg-gray-100";
        }

        return (
            <li key={option.Id} className={className}>
                {option.AnswerText}
                {isCorrectAnswer && <span className="font-bold text-green-700 ml-2">(Correct)</span>}
            </li>
        );
    };

    return (
        <div className="p-6 bg-white text-gray-900 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Student Performance for: {quizTitle}</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Student Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Highest Score</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Last Attempt</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-gray-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((stat) => (
                            <tr key={stat.UserId} className="border-b border-gray-200">
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
                                        disabled={!stat.LastAttemptId}
                                        onClick={() => handleViewDetailsClick(stat.LastAttemptId!)}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {loadingModal ? (
                    <p>Loading details...</p>
                ) : selectedAttemptDetails ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{selectedAttemptDetails.QuizTitle}</h2>
                        <p>Score: {selectedAttemptDetails.AttemptScore}%</p>
                        <p>Date: {new Date(selectedAttemptDetails.AttemptDate).toLocaleString()}</p>
                        <hr className="my-4" />
                        <div className="space-y-4">
                            {selectedAttemptDetails.Questions.map(q => (
                                <div key={q.QuestionId}>
                                    <p className="font-semibold">{q.QuestionText}</p>
                                    <ul className="space-y-2 mt-2">
                                        {q.AnswerOptions.map(opt => renderAnswerOption(opt, q))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p>{error || 'No details available.'}</p>
                )}
            </Modal>
        </div>
    );
};

export default QuizStudentStats;
