
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';

interface Instructor {
    id: number;
    name: string;
}

const CreateCourse = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const categories = [
        "Web Development",
        "Mobile Development",
        "Data Science",
        "Machine Learning",
        "DevOps",
        "Cloud Computing",
        "Cybersecurity",
        "Game Development",
        "Artificial Intelligence",
        "Blockchain",
        "UI/UX Design",
        "Digital Marketing",
        "Business Fundamentals",
        "Project Management",
        "Data Analytics",
    ];
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
                    const response = await axios.get('http://127.0.0.1:8000/api/admin/active-instructors', {
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
            setToast({ message: 'Failed to create course.', type: 'error' });
        }
    };

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Form fields */}
                    <input name="Title" value={course.Title} onChange={handleChange} placeholder="Title" required className="p-2 border rounded" />
                    <input
                        name="Category"
                        value={course.Category}
                        onChange={handleChange}
                        placeholder="Category"
                        list="category-options"
                        className="p-2 border rounded"
                    />
                    <datalist id="category-options">
                        {categories.map((cat, index) => (
                            <option key={index} value={cat} />
                        ))}
                    </datalist>
                    <select name="Difficulty" value={course.Difficulty} onChange={handleChange} className="p-2 border rounded">
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                    </select>
                    <input type="number" name="EstimatedDuration" value={course.EstimatedDuration} onChange={handleChange} placeholder="Estimated Duration (Minutes)" className="p-2 border rounded" />
                </div>
                <textarea name="ShortDescription" value={course.ShortDescription} onChange={handleChange} placeholder="Short Description" className="w-full p-2 border rounded" />
                <textarea name="LongDescription" value={course.LongDescription} onChange={handleChange} placeholder="Long Description" rows={5} className="w-full p-2 border rounded" />

                {user.Role === 'Admin' && (
                    <select name="CreatedBy" value={course.CreatedBy} onChange={handleChange} className="p-2 border rounded w-full">
                        <option value="">Assign to me (Admin)</option>
                        {instructors.map(inst => (
                            <option key={inst.Id} value={inst.Id}>{inst.Name}</option>
                        ))}
                    </select>
                )}

                <button type="submit" className="w-full py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Create Course
                </button>
            </form>
        </div>
    );
};

export default CreateCourse;
