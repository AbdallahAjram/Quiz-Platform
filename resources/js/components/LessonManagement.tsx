import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Trash, Pencil, Brain, Sparkles } from 'lucide-react';
import AIQuizGeneratorModal from './AIQuizGeneratorModal';
import GeneratedQuestionsView from './GeneratedQuestionsView';

interface Quiz {
    Id: number;
    Title: string;
    PassingScore: number;
}

interface Lesson {
    Id: number;
    Title: string;
    Content: string;
    VideoUrl: string;
    Order: number;
    EstimatedDuration: number;
    AttachmentUrl?: string;
    quiz?: Quiz | null;
}

interface GeneratedQuizData {
    questions: any[];
    passingScore: number;
    timeLimit: number;
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
    const navigate = useNavigate();

    // AI Quiz Generation State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generatedQuizData, setGeneratedQuizData] = useState<GeneratedQuizData | null>(null);
    const [aiLessonId, setAiLessonId] = useState<number | null>(null);

    const handleManageCourseQuiz = () => {
        navigate(`/management/quizzes/course/${courseId}`);
    };

    const handleManageQuiz = (lessonId: number) => {
        navigate(`/management/quizzes/${lessonId}`);
    };

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
        if (!generatedQuizData) {
            fetchLessons();
        }
    }, [courseId, generatedQuizData]);

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

    // AI Quiz Handlers
    const handleOpenAiModal = (lessonId: number | null = null) => {
        setAiLessonId(lessonId);
        setIsModalOpen(true);
    };

    const handleGeneratedQuiz = (data: GeneratedQuizData) => {
        setGeneratedQuizData(data);
    };
    
    const handleSaveGeneratedQuiz = () => {
        setGeneratedQuizData(null); // Return to lesson list
        fetchLessons(); // Refresh lessons to show new quiz
        setToast({ message: 'AI-Generated quiz saved successfully!', type: 'success'});
    }

    if (generatedQuizData && courseId) {
        return <GeneratedQuestionsView 
                    questions={generatedQuizData.questions} 
                    courseId={parseInt(courseId)} 
                    lessonId={aiLessonId}
                    onSave={handleSaveGeneratedQuiz}
                    initialPassingScore={generatedQuizData.passingScore}
                    initialTimeLimit={generatedQuizData.timeLimit}
                />;
    }

    return (
        <div className="container mx-auto p-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Lessons</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Create/Edit Form Column */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
                        <button 
                            type="button" 
                            onClick={() => handleOpenAiModal()} 
                            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            title="Generate a quiz for the entire course"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Course Quiz
                        </button>
                    </div>
                    <form onSubmit={handleCreateOrUpdateLesson} className="space-y-4">
                        {/* Form fields */}
                        <input type="text" name="Title" value={editingLesson?.Title || newLesson.Title} onChange={handleNewLessonChange} placeholder="Lesson Title" className="w-full p-2 border rounded" required />
                        <textarea name="Content" value={editingLesson?.Content || newLesson.Content} onChange={handleNewLessonChange} placeholder="Lesson Content" className="w-full p-2 border rounded" rows={4}></textarea>
                        <input type="text" name="VideoUrl" value={editingLesson?.VideoUrl || newLesson.VideoUrl} onChange={handleNewLessonChange} placeholder="Video URL (e.g., YouTube)" className="w-full p-2 border rounded" />
                        <input type="number" name="Order" value={editingLesson?.Order || newLesson.Order} onChange={handleNewLessonChange} placeholder="Order" className="w-full p-2 border rounded" required />
                        <input type="number" name="EstimatedDuration" value={editingLesson?.EstimatedDuration || newLesson.EstimatedDuration} onChange={handleNewLessonChange} placeholder="Duration (minutes)" className="w-full p-2 border rounded" required />
                        <input type="file" id="attachment-input" onChange={handleFileChange} className="w-full p-2 border rounded" />
                        <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400">
                            {isSubmitting ? 'Saving...' : (editingLesson ? 'Update Lesson' : 'Create Lesson')}
                        </button>
                        {editingLesson && <button type="button" onClick={() => setEditingLesson(null)} className="w-full mt-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel Edit</button>}
                    </form>
                </div>

                {/* Existing Lessons Column */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Existing Lessons</h2>
                    <div className="space-y-3">
                        {lessons.length > 0 ? lessons.map((lesson) => (
                            <div key={lesson.Id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="font-bold">{lesson.Title}</p>
                                    <span className="text-xs text-gray-500">Order: {lesson.Order} | Duration: {lesson.EstimatedDuration} mins</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleOpenAiModal(lesson.Id)}
                                        className="p-2 text-gray-500 hover:text-blue-600"
                                        title="Generate AI Quiz for this Lesson"
                                    >
                                        <Sparkles size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleManageQuiz(lesson.Id)} 
                                        className={`p-2 ${lesson.quiz ? 'text-blue-500' : 'text-gray-500'} hover:text-purple-600`}
                                        title={lesson.quiz ? 'Edit Quiz' : 'Create Quiz'}
                                    >
                                        <Brain size={18} />
                                    </button>
                                    <button onClick={() => handleEdit(lesson)} className="p-2 text-gray-500 hover:text-green-600">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(lesson)} className="p-2 text-gray-500 hover:text-red-600">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-gray-500">No lessons created yet.</p>}
                    </div>
                </div>
            </div>

            {courseId && (
                <AIQuizGeneratorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onGenerate={handleGeneratedQuiz}
                    courseId={parseInt(courseId)}
                    lessonId={aiLessonId}
                />
            )}
        </div>
    );
};

export default LessonManagement;