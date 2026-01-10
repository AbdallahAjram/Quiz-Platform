import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Toast from './Toast';

interface Quiz {
    Id: number;
    Title: string;
    has_attempted: boolean;
}

interface Lesson {
    Id: number;
    Title: string;
    Content: string;
    VideoUrl: string;
    AttachmentUrl?: string;
    quiz?: Quiz | null;
}

interface LessonCompletion {
    LessonId: number;
}

const LessonViewer = () => {
    const { courseId, lessonId } = useParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [completions, setCompletions] = useState<LessonCompletion[]>([]);
    const [courseQuiz, setCourseQuiz] = useState<Quiz | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLessonsAndCompletions = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const [lessonsResponse, completionsResponse, courseQuizResponse] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/lessons`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    axios.get(`http://127.0.0.1:8000/api/lesson-completions?CourseId=${courseId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/quiz`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ]);

                setLessons(lessonsResponse.data);
                setCompletions(completionsResponse.data.data);
                setCourseQuiz(courseQuizResponse.data.quiz);

                const targetLessonId = lessonId ? parseInt(lessonId) : lessonsResponse.data[0]?.Id;
                if (targetLessonId) {
                    setCurrentLesson(lessonsResponse.data.find((l: Lesson) => l.Id === targetLessonId) || null);
                } else {
                    setCurrentLesson(null);
                }

            } catch (error) {
                const isQuizError = axios.isAxiosError(error) && error.config.url?.includes('/quiz');
                const isAcceptableError = error.response?.status === 404 || error.response?.status === 403;

                if (isQuizError && isAcceptableError) {
                    setCourseQuiz(null); // It's okay if a quiz doesn't exist or is forbidden, lessons should still load.
                } else {
                    setToast({ message: 'Failed to fetch lesson data.', type: 'error' });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLessonsAndCompletions();
    }, [courseId, lessonId]);

    const handleMarkAsCompleted = async () => {
        if (!currentLesson) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:8000/api/lesson-completions', { LessonId: currentLesson.Id }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setCompletions([...completions, { LessonId: currentLesson.Id }]);
            setToast({ message: 'Lesson marked as completed!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to mark as completed.', type: 'error' });
        }
    };

    const handleDownload = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            
            // Extract filename from URL
            const urlPath = new URL(url).pathname;
            const decodedPath = decodeURIComponent(urlPath);
            const filename = decodedPath.substring(decodedPath.lastIndexOf('/') + 1);
            const finalFilename = filename.split('?')[0].split('/').pop() || 'download';
            
            a.download = finalFilename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            setToast({ message: 'Failed to download resource.', type: 'error' });
        }
    };

    const isCompleted = (lesson: Lesson) => completions.some(c => c.LessonId === lesson.Id);

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading lesson...</div>;
    }

    if (lessons.length === 0) {
        return <div className="p-8 text-center text-gray-500">No lessons have been added to this course yet. Check back soon!</div>;
    }
    
    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-80 bg-white border-r flex flex-col">
                 <div className="p-6 border-b">
                    <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
                        &larr; Back to Dashboard
                    </Link>
                    <h2 className="text-xl font-bold mt-4">Lessons</h2>
                </div>
                <nav className="flex-grow overflow-y-auto">
                    {lessons.map(lesson => (
                        <Link
                            key={lesson.Id}
                            to={`/courses/${courseId}/lessons/${lesson.Id}`}
                            className={`flex items-center justify-between px-6 py-3 text-gray-700 ${currentLesson?.Id === lesson.Id ? 'bg-gray-200' : ''}`}
                        >
                            {lesson.Title}
                            {isCompleted(lesson) && <span className="text-green-500">✓</span>}
                        </Link>
                    ))}
                </nav>
                {courseQuiz && (
                    <div className="p-4 border-t">
                        <h3 className="text-lg font-bold mb-2 text-center">Final Exam</h3>
                        {lessons.length > 0 && completions.length >= lessons.length ? (
                            courseQuiz.has_attempted ? (
                                <button
                                    disabled
                                    className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg cursor-not-allowed"
                                >
                                    Exam Completed
                                </button>
                            ) : (
                                <Link
                                    to={`/quizzes/take/${courseQuiz.Id}`}
                                    className="w-full text-center block px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700"
                                >
                                    Take Final Exam
                                </Link>
                            )
                        ) : (
                            <div className="text-center">
                                <button
                                    disabled
                                    className="w-full px-4 py-3 font-bold text-white bg-gray-400 rounded-lg cursor-not-allowed"
                                >
                                    Take Final Exam
                                </button>
                                <p className="text-xs text-gray-500 mt-2">Complete all lessons to unlock the final exam.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                
                {!currentLesson ? (
                     <div className="text-center text-gray-500">Please select a lesson to start learning.</div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold mb-4">{currentLesson.Title}</h1>
                        {currentLesson.VideoUrl && (
                            <div className="mb-8">
                                <a
                                    href={currentLesson.VideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Watch Lesson on YouTube
                                </a>
                            </div>
                        )}
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentLesson.Content }} />

                        {currentLesson.AttachmentUrl && (
                            <div className="mt-8">
                                <button
                                    onClick={() => handleDownload(currentLesson.AttachmentUrl!)}
                                    className="inline-block px-6 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700"
                                >
                                    Download Resource
                                </button>
                            </div>
                        )}

                        <div className="mt-8 space-y-4">
                            <div>
                                {isCompleted(currentLesson) ? (
                                    <span className="inline-block px-6 py-2 font-semibold text-white bg-green-500 rounded-lg cursor-not-allowed">
                                        ✓ Completed
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleMarkAsCompleted}
                                        className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                                    >
                                        Mark as Completed
                                    </button>
                                )}
                            </div>

                            {currentLesson.quiz && (
                                <div className="p-4 border-t border-gray-200">
                                    <h3 className="text-lg font-bold mb-2">Lesson Quiz</h3>
                                    {isCompleted(currentLesson) ? (
                                        currentLesson.quiz.has_attempted ? (
                                            <button
                                                disabled
                                                className="px-8 py-3 font-bold text-white bg-green-600 rounded-lg cursor-not-allowed text-lg"
                                            >
                                                Quiz Completed
                                            </button>
                                        ) : (
                                            <Link 
                                                to={`/quizzes/take/${currentLesson.quiz.Id}`}
                                                className="px-8 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-lg"
                                            >
                                                Take the Quiz!
                                            </Link>
                                        )
                                    ) : (
                                        <div className="flex items-center space-x-3">
                                            <button
                                                disabled
                                                className="px-8 py-3 font-bold text-white bg-gray-400 rounded-lg cursor-not-allowed text-lg"
                                            >
                                                Take the Quiz!
                                            </button>
                                            <p className="text-gray-500">Complete the lesson to unlock the quiz.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LessonViewer;
