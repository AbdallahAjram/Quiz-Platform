import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Toast from './Toast';

interface Lesson {
    Id: number;
    Title: string;
    Content: string;
    VideoUrl: string;
}

interface LessonCompletion {
    LessonId: number;
}

const LessonViewer = () => {
    const { courseId, lessonId } = useParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [completions, setCompletions] = useState<LessonCompletion[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/lessons`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setLessons(response.data);
                if (lessonId) {
                    setCurrentLesson(response.data.find((l: Lesson) => l.Id === parseInt(lessonId)));
                } else {
                    setCurrentLesson(response.data[0]);
                }
            } catch (error) {
                setToast({ message: 'Failed to fetch lessons.', type: 'error' });
            }
        };

        const fetchCompletions = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://127.0.0.1:8000/api/lesson-completions?CourseId=${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setCompletions(response.data.data);
            } catch (error) {
                console.error('Failed to fetch completions', error);
            }
        };

        fetchLessons();
        fetchCompletions();
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

    const isCompleted = (lesson: Lesson) => completions.some(c => c.LessonId === lesson.Id);

    if (!currentLesson) return <div className="p-8 text-center text-gray-500">Loading lesson...</div>;

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-80 bg-white border-r">
                <div className="p-6">
                    <h2 className="text-xl font-bold">Lessons</h2>
                </div>
                <nav>
                    {lessons.map(lesson => (
                        <Link
                            key={lesson.Id}
                            to={`/courses/${courseId}/lessons/${lesson.Id}`}
                            className={`flex items-center justify-between px-6 py-3 text-gray-700 ${currentLesson.Id === lesson.Id ? 'bg-gray-200' : ''}`}
                        >
                            {lesson.Title}
                            {isCompleted(lesson) && <span className="text-green-500">✓</span>}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="flex-1 p-8">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <h1 className="text-3xl font-bold mb-4">{currentLesson.Title}</h1>
                {currentLesson.VideoUrl && (
                    <div className="mb-8">
                        <iframe
                            width="100%"
                            height="500"
                            src={currentLesson.VideoUrl.replace('watch?v=', 'embed/')}
                            title={currentLesson.Title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentLesson.Content }} />
                <div className="mt-8">
                    {!isCompleted(currentLesson) && (
                        <button
                            onClick={handleMarkAsCompleted}
                            className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                            Mark as Completed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonViewer;
