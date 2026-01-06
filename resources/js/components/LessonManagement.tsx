import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Toast from './Toast';
import { storage } from '../firebase'; // Assuming firebase.ts is in ../
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Trash, Pencil } from 'lucide-react';

interface Lesson {
    Id: number;
    Title: string;
    Content: string;
    VideoUrl: string;
    Order: number;
    EstimatedDuration: number;
    AttachmentUrl?: string;
}

const LessonManagement = () => {
    const { courseId } = useParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newLesson, setNewLesson] = useState({
        Title: '',
        Content: '',
        VideoUrl: '',
        Order: 0,
        EstimatedDuration: 0,
    });
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);

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
        const isNumber = ['Order', 'EstimatedDuration'].includes(name);
        const lesson = editingLesson ? { ...editingLesson, [name]: isNumber ? parseInt(value, 10) || 0 : value } : { ...newLesson, [name]: isNumber ? parseInt(value, 10) || 0 : value };
        if(editingLesson) {
            setEditingLesson(lesson as Lesson);
        } else {
            setNewLesson(lesson);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleCreateOrUpdateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log('1. Form Submission Started');

        let attachmentUrl = editingLesson?.AttachmentUrl || '';

        try {
            if (attachment) {
                if (editingLesson && editingLesson.AttachmentUrl) {
                    try {
                        const oldFileRef = ref(storage, editingLesson.AttachmentUrl);
                        await deleteObject(oldFileRef);
                    } catch (error) {
                        console.error("Failed to delete old attachment, but continuing:", error);
                    }
                }
                try {
                    console.log('2. Firebase Upload Started', attachment);
                    const attachmentRef = ref(storage, `attachments/${attachment.name + uuidv4()}`);
                    const snapshot = await uploadBytes(attachmentRef, attachment);
                    attachmentUrl = await getDownloadURL(snapshot.ref);
                    console.log('3. Firebase URL Received:', attachmentUrl);
                } catch (uploadError) {
                    console.error('FAILED AT STEP: Firebase Upload', uploadError);
                    setToast({ message: 'Upload failed due to a network or CORS issue.', type: 'error' });
                    return;
                }
            }

            const lessonData = {
                ...(editingLesson || newLesson),
                CourseId: parseInt(courseId as string),
                AttachmentUrl: attachmentUrl,
            };
            
            console.log('4. Laravel Request Sent', lessonData);
            const token = localStorage.getItem('token');

            if (editingLesson) {
                await axios.put(`http://127.0.0.1:8000/api/lessons/${editingLesson.Id}`, lessonData, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setToast({ message: 'Lesson updated successfully!', type: 'success' });
            } else {
                await axios.post('http://127.0.0.1:8000/api/lessons', lessonData, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setToast({ message: 'Lesson created successfully!', type: 'success' });
            }

            fetchLessons();
            setNewLesson({ Title: '', Content: '', VideoUrl: '', Order: 0, EstimatedDuration: 0 });
            setEditingLesson(null);
            setAttachment(null);
            const fileInput = document.getElementById('attachment-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error) {
            setToast({ message: `Failed to ${editingLesson ? 'update' : 'create'} lesson.`, type: 'error' });
            console.error(`FAILED AT STEP: Laravel API`, error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setNewLesson(lesson);
    };

    const handleDelete = async (lesson: Lesson) => {
        if (!window.confirm(`Are you sure you want to delete "${lesson.Title}"?`)) return;

        try {
            const token = localStorage.getItem('token');
            if (lesson.AttachmentUrl) {
                try {
                    const fileRef = ref(storage, lesson.AttachmentUrl);
                    await deleteObject(fileRef);
                } catch (error) {
                    console.error('Firebase deletion failed, proceeding with DB deletion:', error);
                    setToast({ message: 'Could not delete cloud file, but proceeding.', type: 'error' });
                }
            }

            await axios.delete(`http://127.0.0.1:8000/api/lessons/${lesson.Id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            setToast({ message: 'Lesson deleted successfully!', type: 'success' });
            fetchLessons();
        } catch (error) {
            setToast({ message: 'Failed to delete lesson.', type: 'error' });
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Lessons</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold mb-4">{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
                    <form onSubmit={handleCreateOrUpdateLesson} className="space-y-4">
                        <input name="Title" value={editingLesson?.Title || newLesson.Title} onChange={handleNewLessonChange} placeholder="Lesson Title" required className="w-full p-2 border rounded" />
                        <textarea name="Content" value={editingLesson?.Content || newLesson.Content} onChange={handleNewLessonChange} placeholder="Lesson Content" required className="w-full p-2 border rounded" />
                        <input name="VideoUrl" value={editingLesson?.VideoUrl || newLesson.VideoUrl} onChange={handleNewLessonChange} placeholder="Video URL" className="w-full p-2 border rounded" />
                        <input type="number" name="Order" value={editingLesson?.Order || newLesson.Order} onChange={handleNewLessonChange} placeholder="Order" required className="w-full p-2 border rounded" />
                        <input type="number" name="EstimatedDuration" value={editingLesson?.EstimatedDuration || newLesson.EstimatedDuration} onChange={handleNewLessonChange} placeholder="Estimated Duration (minutes)" required className="w-full p-2 border rounded" />
                        <div>
                           <label htmlFor="attachment-input" className="block text-sm font-medium text-gray-700">Upload Attachment (Optional)</label>
                            <input id="attachment-input" type="file" onChange={handleFileChange} className="w-full p-2 border rounded mt-1" accept=".pdf,.jpg,.jpeg,.png,.gif,.zip,.rar" />
                        </div>
                        <button type="submit" className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (editingLesson ? 'Update Lesson' : 'Create Lesson')}
                        </button>
                        {editingLesson && (
                            <button type="button" onClick={() => { setEditingLesson(null); setNewLesson({ Title: '', Content: '', VideoUrl: '', Order: 0, EstimatedDuration: 0 }); }} className="w-full py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                                Cancel Edit
                            </button>
                        )}
                    </form>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4">Existing Lessons</h2>
                    <div className="space-y-4">
                        {lessons.map(lesson => (
                            <div key={lesson.Id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{lesson.Title}</h3>
                                    <p>Order: {lesson.Order}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(lesson)} className="p-2 text-gray-600 hover:text-blue-600">
                                        <Pencil size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(lesson)} className="p-2 text-gray-600 hover:text-red-600">
                                        <Trash size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonManagement;
