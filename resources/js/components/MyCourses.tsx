import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Modal from './Modal';

// --- Start of added interfaces ---
interface AnswerOption {
    Id: number;
    AnswerText: string;
}

interface AttemptQuestion {
    QuestionId: number;
    QuestionText: string;
    AnswerOptions: AnswerOption[];
    UserAnswerId: number | number[] | null; // Can be array for MSQ
    CorrectAnswerId: number | number[] | null; // Can be array for MSQ
    IsCorrect: boolean;
    QuestionType: 'MCQ' | 'MSQ' | 'TF'; // Add other types if necessary
}

interface AttemptDetails {
    QuizTitle: string;
    AttemptScore: number;
    AttemptDate: string;
    Questions: AttemptQuestion[];
}
// --- End of added interfaces ---

interface Course {
    Id: number;
    Title: string;
    ShortDescription: string;
    Category: string;
    Difficulty: string;
    totalLessonsCount: number;
    completedLessonsCount: number;
    courseQuiz: {
        Id: number;
        highestAttempt: {
            Id: number;
            Score: number;
        } | null;
    } | null;
}

const CourseCard = ({ course, onViewAnswers }: { course: Course, onViewAnswers: (attemptId: number) => void }) => {
    const difficultyColor: Record<string, string> = {
        Beginner: 'text-green-500',
        Intermediate: 'text-yellow-500',
        Advanced: 'text-red-500',
    };

    const allLessonsCompleted = course.totalLessonsCount > 0 && course.totalLessonsCount === course.completedLessonsCount;
    const progress = course.totalLessonsCount > 0 ? (course.completedLessonsCount / course.totalLessonsCount) * 100 : 0;

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <div className="p-6 flex-grow">
                <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{course.Title}</h3>
                        <p className="text-sm text-gray-500">{course.Category}</p>
                    </div>
                </div>
                <p className="text-gray-600 mb-4 h-12 overflow-hidden">{course.ShortDescription}</p>
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className={`font-semibold ${difficultyColor[course.Difficulty] || 'text-gray-500'}`}>{course.Difficulty}</span>
                    <span className="text-gray-600">{course.completedLessonsCount} / {course.totalLessonsCount} lessons</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <div className="p-6 bg-gray-50">
                {course.courseQuiz?.highestAttempt ? (
                    <div>
                        <p className="text-center text-sm text-gray-600 mb-2">
                            Highest Score: <span className="font-bold">{course.courseQuiz.highestAttempt.Score.toFixed(0)}%</span>
                        </p>
                        <button onClick={() => onViewAnswers(course.courseQuiz!.highestAttempt!.Id)} className="w-full block text-center mt-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                            View Your Answers
                        </button>
                    </div>
                ) : (allLessonsCompleted && course.courseQuiz ? (
                     <Link to={`/quizzes/take/${course.courseQuiz.Id}`} className="w-full block text-center mt-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        Take Final Quiz
                    </Link>
                ) : (
                    <Link to={`/courses/${course.Id}/lessons`} className="w-full block text-center mt-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        View Course
                    </Link>
                ))}
            </div>
        </div>
    );
};

const MyCourses = () => {
    const [courses, setCourses] = useState<Course[] | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Start of added state ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<AttemptDetails | null>(null);
    const [loadingModal, setLoadingModal] = useState(false);
    const [modalError, setModalError] = useState('');
    const token = localStorage.getItem('token');
    // --- End of added state ---

    const fetchEnrolledCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://127.0.0.1:8000/api/enrollments/my-courses', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch enrolled courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    // --- Start of added functions ---
    const handleViewAnswersClick = async (attemptId: number) => {
        if (!attemptId) return;
        setLoadingModal(true);
        setModalError('');
        setIsModalOpen(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/attempts/${attemptId}/details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSelectedAttemptDetails(response.data);
        } catch (err) {
            console.error('Failed to fetch attempt details', err);
            setModalError('Failed to load attempt details.');
        } finally {
            setLoadingModal(false);
        }
    };

    const renderAnswerOption = (option: AnswerOption, question: AttemptQuestion) => {
        const isMSQ = question.QuestionType === 'MSQ';
        const userAnswers = Array.isArray(question.UserAnswerId) ? question.UserAnswerId : [question.UserAnswerId];
        const correctAnswers = Array.isArray(question.CorrectAnswerId) ? question.CorrectAnswerId : [question.CorrectAnswerId];

        const isSelected = userAnswers.includes(option.Id);
        const isCorrect = correctAnswers.includes(option.Id);

        let className = "p-2 rounded flex items-center";

        if (isSelected && isCorrect) {
            className += " bg-green-200 border-green-500"; // User chose correctly
        } else if (isSelected && !isCorrect) {
            className += " bg-red-200 border-red-500";   // User chose incorrectly
        } else if (isCorrect) {
            className += " bg-green-100"; // This was a correct answer, but user didn't pick it
        } else {
            className += " bg-gray-100";  // Regular incorrect option
        }

        return (
            <li key={option.Id} className={className}>
                <input type={isMSQ ? "checkbox" : "radio"} checked={isSelected} readOnly className="mr-2" />
                {option.AnswerText}
                {isCorrect && <span className="font-bold text-green-700 ml-auto"> (Correct)</span>}
            </li>
        );
    };
    // --- End of added functions ---

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your courses...</div>;
    if (!courses) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Learning</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => <CourseCard key={course.Id} course={course} onViewAnswers={handleViewAnswersClick} />)}
            </div>

            {/* --- Start of added modal --- */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {loadingModal ? (
                    <p>Loading details...</p>
                ) : selectedAttemptDetails ? (
                    <div className="max-h-[80vh] overflow-y-auto">
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
                    <p>{modalError || 'No details available.'}</p>
                )}
            </Modal>
            {/* --- End of added modal --- */}
        </div>
    );
};

export default MyCourses;
