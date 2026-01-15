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
    ImagePath: string | null;
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
    const [questionImages, setQuestionImages] = useState<{ [key: number]: File }>({});
    const [imagePreviews, setImagePreviews] = useState<{ [key: number]: string }>({});
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
            setQuestions(response.data.quiz.questions.map((q: any) => ({...q, ImagePath: q.ImagePath, Answers: q.answer_options || []})));
        } catch (error) {
            console.error("Failed to fetch quiz data:", error);
            setToast({ message: 'No existing quiz found. Fill out the form to create one.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleImageChange = (questionId: number, file: File | null) => {
        if (file) {
            setQuestionImages(prev => ({ ...prev, [questionId]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => ({ ...prev, [questionId]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (questionId: number) => {
        setQuestionImages(prev => {
            const newImages = { ...prev };
            delete newImages[questionId];
            return newImages;
        });
        setImagePreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[questionId];
            return newPreviews;
        });
        setQuestions(questions.map(q => {
            if (q.Id === questionId) {
                // If the image was on the server, mark for deletion. Otherwise, just clear the path.
                return { ...q, ImagePath: q.ImagePath ? 'DELETE' : null };
            }
            return q;
        }));
    };
    
    const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        if (quiz) {
            setQuiz({ ...quiz, [name]: val });
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
                [name]: val
            });
        }
    };
    
    function handleCorrectAnswerChange(questionId: number, answerId: number) {
        setQuestions(questions.map(q => 
            q.Id === questionId 
                ? { ...q, Answers: q.Answers.map(a => ({ ...a, IsCorrect: a.Id === answerId })) } 
                : q
        ));
    }

    function handleCorrectAnswerChangeMSQ(questionId: number, answerId: number) {
        setQuestions(questions.map(q => 
            q.Id === questionId 
                ? { ...q, Answers: q.Answers.map(a => a.Id === answerId ? { ...a, IsCorrect: !a.IsCorrect } : a) } 
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
            QuestionType: 'MCQ',
            Order: questions.length + 1,
            Answers: [],
            ImagePath: null,
        };
        setQuestions([...questions, newQuestion]);
    }

    const handleSaveQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
    
        const token = localStorage.getItem('token');
        const formData = new FormData();
    
        // Clean up temporary IDs and prepare questions for API
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

        formData.append('Quiz', JSON.stringify(quiz));
        formData.append('Questions', JSON.stringify(questionsForApi));

        questions.forEach((q, index) => {
            if (questionImages[q.Id]) {
                formData.append(`questions[${index}][image]`, questionImages[q.Id]);
            }
        });
        
        const url = lessonId 
            ? `http://127.0.0.1:8000/api/lessons/${lessonId}/quiz` 
            : `http://127.0.0.1:8000/api/courses/${courseId}/quiz`;
    
        try {
            await axios.post(url, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            setToast({ message: 'Quiz saved successfully!', type: 'success' });
            // Clear previews and file inputs after successful upload
            setImagePreviews({});
            setQuestionImages({});
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
                    <div className="mt-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="ShuffleQuestions"
                                checked={quiz?.ShuffleQuestions || false}
                                onChange={handleQuizChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2 text-gray-700">Shuffle Questions</span>
                        </label>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Questions</h2>
                    {questions.map((question, index) => (
                        <div key={question.Id} className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                                <div className="flex items-center space-x-4">
                                    <select 
                                        value={question.QuestionType} 
                                        onChange={(e) => handleQuestionChange(question.Id, 'QuestionType', e.target.value)}
                                        className="p-2 border rounded"
                                    >
                                        <option value="MCQ">Multiple Choice (Single Answer)</option>
                                        <option value="MSQ">Multiple Select (Multiple Answers)</option>
                                        <option value="TF">True/False</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(question.Id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={question.QuestionText}
                                onChange={(e) => handleQuestionChange(question.Id, 'QuestionText', e.target.value)}
                                placeholder="Question Text"
                                className="w-full p-2 border rounded mt-2"
                                required
                            />
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700">Question Image</label>
                                {imagePreviews[question.Id] ? (
                                    <img src={imagePreviews[question.Id]} alt="Preview" className="mt-2 max-h-40 rounded" />
                                ) : (
                                    question.ImagePath && question.ImagePath !== 'DELETE' && (
                                        <img src={`http://127.0.0.1:8000/storage/${question.ImagePath}`} alt="Question visual aid" className="mt-2 max-h-40 rounded" />
                                    )
                                )}
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => handleImageChange(question.Id, e.target.files ? e.target.files[0] : null)}
                                    className="mt-2"
                                />
                                {(imagePreviews[question.Id] || (question.ImagePath && question.ImagePath !== 'DELETE')) && (
                                    <button
                                        type="button"
                                        onClick={() => removeImage(question.Id)}
                                        className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                            <div className="mt-4">
                                <h4 className="font-semibold">Answers</h4>
                                {question.Answers.map((answer) => (
                                    <div key={answer.Id} className="flex items-center space-x-2 mt-2">
                                        {question.QuestionType === 'MSQ' ? (
                                            <input
                                                type="checkbox"
                                                checked={answer.IsCorrect}
                                                onChange={() => handleCorrectAnswerChangeMSQ(question.Id, answer.Id)}
                                                className="form-checkbox h-5 w-5 text-blue-600"
                                            />
                                        ) : (
                                            <input
                                                type="radio"
                                                name={`correctAnswer-${question.Id}`}
                                                checked={answer.IsCorrect}
                                                onChange={() => handleCorrectAnswerChange(question.Id, answer.Id)}
                                            />
                                        )}
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
