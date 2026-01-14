import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';

interface Instructor {
    Id: number;
    Name: string;
}

const CourseForm = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [course, setCourse] = useState({
        Title: '',
        ShortDescription: '',
        LongDescription: '',
        Category: '',
        Difficulty: 'Beginner',
        EstimatedDuration: 60,
        CreatedBy: user.Role === 'Admin' ? '' : user.Id,
    });

    useEffect(() => {
        if (user.Role === 'Admin') {
            const fetchInstructors = async () => {
                try {
                    const token = localStorage.getItem('token');
                    // Ensure this endpoint exists in api.php
                    const response = await axios.get('http://127.0.0.1:8000/api/users/instructors', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    setInstructors(response.data);
                } catch (error) {
                    setToast({ message: 'Failed to fetch instructors.', type: 'error' });
                }
            };
            fetchInstructors();
        }
    }, [user.Role]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCourse(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:8000/api/courses', course, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setToast({ message: 'Course created successfully!', type: 'success' });
            setTimeout(() => navigate('/management/courses'), 2000);
        } catch (error) {
            setToast({ message: 'Failed to create course. Check all fields.', type: 'error' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Build a New Course</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Course Title</label>
                        <input name="Title" value={course.Title} onChange={handleChange} placeholder="e.g. Master Laravel" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <input name="Category" value={course.Category} onChange={handleChange} placeholder="Web Dev" className="w-full p-2 border rounded" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Difficulty Level</label>
                        <select name="Difficulty" value={course.Difficulty} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Duration (Minutes)</label>
                        <input type="number" name="EstimatedDuration" value={course.EstimatedDuration} onChange={handleChange} className="w-full p-2 border rounded" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Short Summary</label>
                    <textarea name="ShortDescription" value={course.ShortDescription} onChange={handleChange} placeholder="A one-sentence summary..." className="w-full p-2 border rounded" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Detailed Description</label>
                    <textarea name="LongDescription" value={course.LongDescription} onChange={handleChange} rows={5} placeholder="What will students learn?" className="w-full p-2 border rounded" />
                </div>

                {user.Role === 'Admin' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Assign Instructor</label>
                        <select name="CreatedBy" value={course.CreatedBy} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50">
                            <option value={user.Id}>Assign to myself (Admin)</option>
                            {instructors.map(inst => (
                                <option key={inst.Id} value={inst.Id}>{inst.Name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="pt-4">
                    <button type="submit" className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg transition-all">
                        Create Course
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseForm;