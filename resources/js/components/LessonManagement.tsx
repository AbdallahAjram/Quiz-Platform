import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Toast from './Toast';

interface Lesson {
    Id: number;
    Title: string;
    Content: string;
    VideoUrl: string;
    Order: number;
    EstimatedDuration: number;
}

const LessonManagement = () => {
    const { courseId } = useParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [newLesson, setNewLesson] = useState({
        Title: '',
        Content: '',
        VideoUrl: '',
        Order: 0,
        EstimatedDuration: 0,
    });

    const fetchLessons = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://127.0.0.1:8000/api/courses/${courseId}/lessons`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setLessons(response.data);
        } catch (error) {
            setToast({ message: 'Failed to fetch lessons.', type: 'error' });
        }
    };

    useEffect(() => {
        fetchLessons();
    }, [courseId]);

    const handleNewLessonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewLesson(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:8000/api/lessons', { ...newLesson, CourseId: courseId }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setToast({ message: 'Lesson created successfully!', type: 'success' });
            fetchLessons();
            setNewLesson({
                Title: '',
                Content: '',
                VideoUrl: '',
                Order: 0,
                EstimatedDuration: 0,
            });
        } catch (error) {
            setToast({ message: 'Failed to create lesson. Check all fields.', type: 'error' });
        }
    };

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Lessons</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-4">Create New Lesson</h2>
                    <form onSubmit={handleCreateLesson} className="space-y-4">
                        <input name="Title" value={newLesson.Title} onChange={handleNewLessonChange} placeholder="Lesson Title" required className="w-full p-2 border rounded" />
                        <textarea name="Content" value={newLesson.Content} onChange={handleNewLessonChange} placeholder="Lesson Content" required className="w-full p-2 border rounded" />
                        <input name="VideoUrl" value={newLesson.VideoUrl} onChange={handleNewLessonChange} placeholder="Video URL" className="w-full p-2 border rounded" />
                        <input type="number" name="Order" value={newLesson.Order} onChange={handleNewLessonChange} placeholder="Order" required className="w-full p-2 border rounded" />
                        <input type="number" name="EstimatedDuration" value={newLesson.EstimatedDuration} onChange={handleNewLessonChange} placeholder="Estimated Duration (minutes)" required className="w-full p-2 border rounded" />
                        <button type="submit" className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Create Lesson</button>
                    </form>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4">Existing Lessons</h2>
                    <div className="space-y-4">
                        {lessons.map(lesson => (
                            <div key={lesson.Id} className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="font-bold">{lesson.Title}</h3>
                                <p>Order: {lesson.Order}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonManagement;
