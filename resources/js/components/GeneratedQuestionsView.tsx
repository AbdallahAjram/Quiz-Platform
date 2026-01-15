import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

interface AnswerOption {
    AnswerText: string;
    IsCorrect: boolean;
}

interface Question {
    QuestionText: string;
    QuestionType: string; // 'MCQ', 'MSQ', 'TF', etc.
    answer_options: AnswerOption[];
    ImagePath: string | null;
}

interface GeneratedQuestionsViewProps {
    questions: Question[];
    courseId: number;
    lessonId: number | null;
    onSave: () => void;
    initialPassingScore?: number;
    initialTimeLimit?: number;
}

const GeneratedQuestionsView: React.FC<GeneratedQuestionsViewProps> = ({ questions, courseId, lessonId, onSave, initialPassingScore = 80, initialTimeLimit = 10 }) => {
    const [editableQuestions, setEditableQuestions] = useState(questions);
    const [quizTitle, setQuizTitle] = useState('New AI-Generated Quiz');
    const [passingScore, setPassingScore] = useState(initialPassingScore);
    const [timeLimit, setTimeLimit] = useState(initialTimeLimit);
    const [saving, setSaving] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        setEditableQuestions(questions);
    }, [questions]);

    const handleQuestionChange = (qIndex: number, newText: string) => {
        const updatedQuestions = [...editableQuestions];
        updatedQuestions[qIndex].QuestionText = newText;
        setEditableQuestions(updatedQuestions);
    };

    const handleAnswerChange = (qIndex: number, aIndex: number, newText: string) => {
        const updatedQuestions = [...editableQuestions];
        updatedQuestions[qIndex].answer_options[aIndex].AnswerText = newText;
        setEditableQuestions(updatedQuestions);
    };

    const handleCorrectAnswerChange = (qIndex: number, aIndex: number) => {
        const updatedQuestions = [...editableQuestions];
        updatedQuestions[qIndex].answer_options.forEach((opt, i) => {
            opt.IsCorrect = i === aIndex;
        });
        setEditableQuestions(updatedQuestions);
    };

    const handleCorrectAnswerChangeMSQ = (qIndex: number, aIndex: number) => {
        const updatedQuestions = [...editableQuestions];
        updatedQuestions[qIndex].answer_options[aIndex].IsCorrect = !updatedQuestions[qIndex].answer_options[aIndex].IsCorrect;
        setEditableQuestions(updatedQuestions);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post('http://127.0.0.1:8000/api/ai/save-quiz', {
                CourseId: courseId,
                LessonId: lessonId,
                Title: quizTitle,
                PassingScore: passingScore,
                TimeLimit: timeLimit,
                questions: editableQuestions,
            }, { headers: { 'Authorization': `Bearer ${token}` } });
            
            onSave();

        } catch (error) {
            console.error('Failed to save quiz', error);
            alert('Failed to save quiz. Check console for details.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Review Generated Quiz</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label htmlFor="quiz_title" className="block text-sm font-medium text-gray-700">
                        Quiz Title
                    </label>
                    <input
                        type="text"
                        id="quiz_title"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter a title for this quiz"
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
            
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                {editableQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-4 shadow-md rounded-lg">
                        <textarea
                            value={q.QuestionText}
                            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        <div className="mt-4 space-y-2">
                            {q.answer_options.map((ans, aIndex) => (
                                <div key={aIndex} className="flex items-center">
                                    {q.QuestionType === 'MSQ' ? (
                                        <input
                                            type="checkbox"
                                            checked={ans.IsCorrect}
                                            onChange={() => handleCorrectAnswerChangeMSQ(qIndex, aIndex)}
                                            className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <input
                                            type="radio"
                                            name={`question-${qIndex}`}
                                            checked={ans.IsCorrect}
                                            onChange={() => handleCorrectAnswerChange(qIndex, aIndex)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                        />
                                    )}
                                    <input
                                        type="text"
                                        value={ans.AnswerText}
                                        onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                                        className={`ml-3 block w-full sm:text-sm border-gray-300 rounded-md ${ans.IsCorrect ? 'font-semibold' : ''}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || !quizTitle}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                    <Save className="h-5 w-5 mr-2" />
                    {saving ? 'Saving...' : 'Save to Quizify'}
                </button>
            </div>
        </div>
    );
};

export default GeneratedQuestionsView;