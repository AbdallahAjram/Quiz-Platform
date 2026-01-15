import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, X } from 'lucide-react';

interface Lesson {
    Id: number;
    Title: string;
}

interface GeneratedQuizData {
    questions: any;
    passingScore: number;
    timeLimit: number;
}

interface AIQuizGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: GeneratedQuizData) => void;
    courseId: number;
    lessonId: number | null;
}

const AIQuizGeneratorModal: React.FC<AIQuizGeneratorModalProps> = ({ isOpen, onClose, onGenerate, courseId, lessonId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [contextType, setContextType] = useState('prompt'); // 'prompt' or 'lessons'
    const [numQuestions, setNumQuestions] = useState(5);
    const [numChoices, setNumChoices] = useState(4);
    const [passingScore, setPassingScore] = useState(80);
    const [timeLimit, setTimeLimit] = useState(10);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [lessonIds, setLessonIds] = useState<number[]>([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (isOpen && contextType === 'lessons') {
            axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/lessons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => setLessons(response.data))
            .catch(err => console.error('Failed to fetch lessons:', err));
        }
    }, [isOpen, contextType, courseId, token]);
    
    useEffect(() => {
        if (lessonId) {
            setContextType('lessons');
            setLessonIds([lessonId]);
        } else {
            setContextType('prompt');
            setLessonIds([]);
        }
    }, [lessonId]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload: any = {
                num_questions: numQuestions,
                num_choices: numChoices,
                CourseId: courseId,
                LessonId: lessonId,
            };
            if (contextType === 'prompt') {
                payload.prompt = prompt;
            } else {
                payload.lesson_ids = lessonIds;
            }

            const response = await axios.post('http://127.0.0.1:8000/api/ai/generate-quiz', payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            onGenerate({ questions: response.data, passingScore, timeLimit });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">✨ Generate with Quizify AI</h2>
                    <button onClick={onClose}><X className="h-6 w-6" /></button>
                </div>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Context Type</label>
                        <select
                            value={contextType}
                            onChange={(e) => setContextType(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="prompt">Text Prompt</option>
                            <option value="lessons">Select Lessons from this Course</option>
                        </select>
                    </div>

                    {contextType === 'prompt' ? (
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                                Prompt
                            </label>
                            <textarea
                                id="prompt"
                                rows={4}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., 'A quiz about the basics of React Hooks'"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lessons</label>
                            <select
                                multiple
                                className="mt-1 block w-full h-40 shadow-sm sm:text-sm border-gray-300 rounded-md"
                                value={lessonIds.map(String)}
                                onChange={(e) => setLessonIds(Array.from(e.target.selectedOptions, option => Number(option.value)))}
                            >
                                {lessons.map(lesson => (
                                    <option key={lesson.Id} value={lesson.Id}>{lesson.Title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="num_questions" className="block text-sm font-medium text-gray-700">
                                Number of Questions
                            </label>
                            <input
                                type="number"
                                id="num_questions"
                                min="1"
                                max="20"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(Number(e.target.value))}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="num_choices" className="block text-sm font-medium text-gray-700">
                                Choices per Question
                            </label>
                            <input
                                type="number"
                                id="num_choices"
                                min="2"
                                max="8"
                                value={numChoices}
                                onChange={(e) => setNumChoices(Number(e.target.value))}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                         <div>
                            <label htmlFor="passing_score" className="block text-sm font-medium text-gray-700">
                                Passing Score (%)
                            </label>
                            <input
                                type="number"
                                id="passing_score"
                                min="0"
                                max="100"
                                value={passingScore}
                                onChange={(e) => setPassingScore(Number(e.target.value))}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700">
                                Time Limit (Minutes)
                            </label>
                            <input
                                type="number"
                                id="time_limit"
                                min="0"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                    >
                        {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                        {loading ? 'Quizify AI is thinking...' : 'Generate Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIQuizGeneratorModal;