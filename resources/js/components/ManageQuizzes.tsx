import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Navigate } from 'react-router-dom';
import Toast from './Toast';

interface AnswerOption {
    Id: number;
    QuestionId: number;
    AnswerText: string;
    IsCorrect: boolean;
}

interface Question {
    Id: number;
    QuizId: number;
    QuestionText: string;
    QuestionType: string;
    Order: number;
    Answers: AnswerOption[];
}

interface Quiz {
    Id: number;
    CourseId: number;
    LessonId: number;
    Title: string;
    PassingScore: number;
    TimeLimit: number;
    ShuffleQuestions: boolean;
}


const ManageQuizzes = () => {
    const { lessonId, courseId } = useParams<{ lessonId?: string, courseId?: string }>();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    if (!lessonId && !courseId) {
        return <Navigate to="/management/courses" />;
    }

    const fetchQuiz = async () => {
        const url = lessonId 
            ? `http://127.0.0.1:8000/api/lessons/${lessonId}/quiz` 
            : `http://127.0.0.1:8000/api/courses/${courseId}/quiz`;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setQuiz(response.data.quiz);
            setQuestions(response.data.quiz.questions.map((q: any) => ({...q, Answers: q.answer_options || []})));
        } catch (error) {
            console.error("Failed to fetch quiz data:", error);
            setToast({ message: 'No existing quiz found. Fill out the form to create one.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (quiz) {
            setQuiz({ ...quiz, [name]: value });
        } else {
            // If there is no quiz, create a new one
            setQuiz({
                Id: 0,
                CourseId: parseInt(courseId || '0'),
                LessonId: parseInt(lessonId || '0'),
                Title: '',
                PassingScore: 0,
                TimeLimit: 0,
                ShuffleQuestions: false,
                [name]: value
            });
        }
    };
    
    function handleAnswerChange(questionId: number, answerId: number, text: string) {
        setQuestions(questions.map(q => 
            q.Id === questionId 
                ? { ...q, Answers: q.Answers.map(a => a.Id === answerId ? { ...a, AnswerText: text } : a) } 
                : q
        ));
    }

    function handleCorrectAnswerChange(questionId: number, answerId: number) {
        setQuestions(questions.map(q => 
            q.Id === questionId 
                ? { ...q, Answers: q.Answers.map(a => ({ ...a, IsCorrect: a.Id === answerId })) } 
                : q
        ));
    }

    function removeAnswerOption(questionId: number, answerId: number) {
        setQuestions(questions.map(q => 
            q.Id === questionId 
                ? { ...q, Answers: q.Answers.filter(a => a.Id !== answerId) } 
                : q
        ));
    }

    function addAnswerOption(questionId: number) {
        const newAnswer: AnswerOption = {
            Id: Date.now(), // Temporary ID
            QuestionId: questionId,
            AnswerText: '',
            IsCorrect: false,
        };
        setQuestions(questions.map(q => 
            q.Id === questionId ? { ...q, Answers: [...q.Answers, newAnswer] } : q
        ));
    }

    function handleQuestionChange(questionId: number, field: string, value: any) {
        setQuestions(questions.map(q => q.Id === questionId ? { ...q, [field]: value } : q));
    }

    function removeQuestion(questionId: number) {
        setQuestions(questions.filter(q => q.Id !== questionId));
    }

    function addQuestion() {
        const newQuestion: Question = {
            Id: Date.now(), // Temporary ID for client-side key
            QuizId: quiz?.Id || 0,
            QuestionText: '',
            QuestionType: 'single',
            Order: questions.length + 1,
            Answers: [],
        };
        setQuestions([...questions, newQuestion]);
    }

    const handleSaveQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
    
        const token = localStorage.getItem('token');
    
        // Clean up temporary IDs
        const questionsForApi = questions.map(q => {
            const { Id, ...restOfQuestion } = q;
            return {
                ...restOfQuestion,
                Id: Id > 1000000 ? null : Id, // Assuming temp IDs are large numbers
                Answers: q.Answers.map(a => {
                    const { Id: answerId, ...restOfAnswer } = a;
                    return {
                        ...restOfAnswer,
                        Id: answerId > 1000000 ? null : answerId,
                    };
                }),
            };
        });
        
        const url = lessonId 
            ? `http://127.0.0.1:8000/api/lessons/${lessonId}/quiz` 
            : `http://127.0.0.1:8000/api/courses/${courseId}/quiz`;
    
        try {
            await axios.post(url, {
                Quiz: quiz,
                Questions: questionsForApi,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setToast({ message: 'Quiz saved successfully!', type: 'success' });
            fetchQuiz(); // Refetch to get correct IDs from DB
        } catch (error) {
            console.error('Failed to save quiz:', error);
            setToast({ message: 'Failed to save quiz. Please check the console for details.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (lessonId || courseId) {
            fetchQuiz();
        }
    }, [lessonId, courseId]);

    if (loading) {
        return <div>Loading...</div>;
    }
    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Quiz</h1>
            
            <form onSubmit={handleSaveQuiz}>
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Quiz Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            name="Title"
                            value={quiz?.Title || ''}
                            onChange={handleQuizChange}
                            placeholder="Quiz Title"
                            className="w-full p-2 border rounded"
                            required
                        />
                        <input
                            type="number"
                            name="PassingScore"
                            value={quiz?.PassingScore || ''}
                            onChange={handleQuizChange}
                            placeholder="Passing Score (%)"
                            className="w-full p-2 border rounded"
                            required
                        />
                        <input
                            type="number"
                            name="TimeLimit"
                            value={quiz?.TimeLimit || ''}
                            onChange={handleQuizChange}
                            placeholder="Time Limit (minutes)"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Questions</h2>
                    {questions.map((question, index) => (
                        <div key={question.Id} className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(question.Id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                            <textarea
                                value={question.QuestionText}
                                onChange={(e) => handleQuestionChange(question.Id, 'QuestionText', e.target.value)}
                                placeholder="Question Text"
                                className="w-full p-2 border rounded mt-2"
                                required
                            />
                            <div className="mt-4">
                                <h4 className="font-semibold">Answers</h4>
                                {question.Answers.map((answer) => (
                                    <div key={answer.Id} className="flex items-center space-x-2 mt-2">
                                        <input
                                            type="radio"
                                            name={`correctAnswer-${question.Id}`}
                                            checked={answer.IsCorrect}
                                            onChange={() => handleCorrectAnswerChange(question.Id, answer.Id)}
                                        />
                                        <input
                                            type="text"
                                            value={answer.AnswerText}
                                            onChange={(e) => handleAnswerChange(question.Id, answer.Id, e.target.value)}
                                            placeholder="Answer Text"
                                            className="w-full p-2 border rounded"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeAnswerOption(question.Id, answer.Id)}
                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addAnswerOption(question.Id)}
                                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Add Answer
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Add Question
                    </button>
                </div>

                <button 
                    type="submit" 
                    className="mt-8 w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Quiz'}
                </button>
            </form>
        </div>
    );
};

export default ManageQuizzes;
