import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Toast from './Toast';

// --- Type Definitions (PascalCase) ---
interface AnswerOption {
    Id: number;
    QuestionId: number;
    AnswerText: string;
    IsCorrect: boolean;
}

interface Question {
    Id: number;
    QuestionText: string;
    answerOptions: AnswerOption[]; // Relationship name from Laravel JSON
}

interface Quiz {
    Id: number;
    Title: string;
    PassingScore: number;
    TimeLimit: number; // in minutes
    questions: Question[];
}

interface QuizAttemptResult {
    AttemptId: number;
    Score: number;
    IsPassed: boolean;
    PassingScore: number;
}

const TakeQuiz = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();

    // --- State Management ---
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [result, setResult] = useState<QuizAttemptResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchQuiz = async () => {
            if (!quizId) {
                setIsLoading(false);
                setToast({ message: 'No Quiz ID provided.', type: 'error' });
                return;
            }
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://127.0.0.1:8000/api/quizzes/${quizId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                
                const fetchedQuiz = response.data.quiz;
                setQuiz(fetchedQuiz);

                // --- TIMER ACTIVATION ---
                if (fetchedQuiz && typeof fetchedQuiz.TimeLimit === 'number') {
                    setTimeLeft(fetchedQuiz.TimeLimit * 60);
                } else {
                    setTimeLeft(null); // Explicitly set to null if no time limit
                }

            } catch (error: any) {
                if (error.response && error.response.status === 403) {
                    setToast({ message: error.response.data.message || 'You have not met the prerequisites to take this quiz.', type: 'error' });
                    navigate('/dashboard/courses');
                } else {
                    setToast({ message: 'Failed to fetch quiz data.', type: 'error' });
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId, navigate]);

    // --- Timer Countdown Logic ---
    useEffect(() => {
        if (isSubmitting || result) return; // Stop timer if submitting or finished
        if (timeLeft === 0) {
            handleSubmit();
            return;
        }
        if (timeLeft === null) return; // Don't start interval if no time limit

        const intervalId = setInterval(() => {
            setTimeLeft(t => (t !== null ? t - 1 : null));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, isSubmitting, result]);

    // --- Memoized Values ---
    const currentQuestion = useMemo(() => quiz?.questions?.[currentQuestionIndex], [quiz, currentQuestionIndex]);
    const totalQuestions = useMemo(() => quiz?.questions?.length ?? 0, [quiz]);
    const progress = useMemo(() => totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0, [currentQuestionIndex, totalQuestions]);
    
    // --- Event Handlers ---
    const handleAnswerSelect = (questionId: number, answerId: number) => {
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting || !quiz) return;
        setIsSubmitting(true);

        const answersPayload = Object.entries(selectedAnswers).map(([questionId, answerOptionId]) => ({
            QuestionId: parseInt(questionId, 10),
            AnswerOptionId: answerOptionId,
        }));
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://127.0.0.1:8000/api/quiz-attempts`, 
                { 
                    QuizId: quiz.Id,
                    Answers: answersPayload.map(answer => ({
                        QuestionId: answer.QuestionId,
                        SelectedOptionId: answer.AnswerOptionId,
                    }))
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setResult(response.data.data);
            setToast({ message: 'Quiz submitted successfully!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to submit quiz.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UI Rendering ---
    const formatTime = (seconds: number | null): string => {
        if (seconds === null) return 'No Limit';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // --- RENDER GUARDS ---
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading Quiz...</div>;
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Quiz not found or is empty.</div>;
    }
    
    return (
        <div className="min-h-screen bg-gray-800 p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                
                {result ? (
                    <div className="bg-black bg-opacity-50 backdrop-blur-lg p-8 rounded-xl shadow-2xl text-center text-white">
                        <h1 className="text-4xl font-bold mb-4">Quiz Results</h1>
                        <p className="text-xl mb-2">Your Score:</p>
                        <p className={`text-6xl font-bold mb-4 ${result.IsPassed ? 'text-green-400' : 'text-red-400'}`}>
                            {result.Score.toFixed(0)}%
                        </p>
                        <p className="text-lg mb-6">
                            Passing Score: {result.PassingScore}%
                        </p>
                        {result.IsPassed ? (
                            <p className="text-2xl text-green-300 mb-8">Congratulations, you passed!</p>
                        ) : (
                            <p className="text-2xl text-red-300 mb-8">You did not pass. Better luck next time!</p>
                        )}
                        <button onClick={() => navigate('/dashboard/courses')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                            Back to Courses
                        </button>
                    </div>
                ) : (
                    <div className="bg-black bg-opacity-50 backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl text-white">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl sm:text-3xl font-bold">{quiz.Title}</h1>
                            <div className="text-xl sm:text-2xl font-mono bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                                <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                        </div>

                        {currentQuestion && (
                            <div>
                                <h2 className="text-xl sm:text-2xl font-semibold mb-6">{currentQuestion.QuestionText}</h2>
                                <div className="space-y-3">
                                    {/* --- ANSWER OPTIONS MAPPING --- */}
                                    {currentQuestion.answerOptions && currentQuestion.answerOptions.length > 0 ? (
                                        currentQuestion.answerOptions.map(option => (
                                            <label key={option.Id} className={`block w-full text-left p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedAnswers[currentQuestion.Id] === option.Id ? 'bg-blue-500 border-blue-300' : 'bg-white bg-opacity-10 hover:bg-opacity-20 border-transparent'}`}>
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.Id}`}
                                                    className="sr-only"
                                                    checked={selectedAnswers[currentQuestion.Id] === option.Id}
                                                    onChange={() => handleAnswerSelect(currentQuestion.Id, option.Id)}
                                                />
                                                {option.AnswerText}
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-gray-400">No answer options available for this question.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <button onClick={handleBack} disabled={currentQuestionIndex === 0} className="px-6 py-2 font-semibold bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50">Back</button>
                            {currentQuestionIndex === totalQuestions - 1 ? (
                                <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 font-semibold bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                </button>
                            ) : (
                                <button onClick={handleNext} className="px-6 py-2 font-semibold bg-blue-600 rounded-lg hover:bg-blue-700">Next</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TakeQuiz;
