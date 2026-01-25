import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from './Toast';

interface Course {
    Id: number;
    Title: string;
    CertificatesEnabled: boolean;
    instructor?: {
        Name: string;
    };
}

const CertificateManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            // Re-using the index route which now handles filtering by role
            const response = await axios.get('http://127.0.0.1:8000/api/courses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCourses(response.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setToast({ message: 'Failed to load courses.', type: 'error' });
            setLoading(false);
        }
    };

    const handleToggle = async (courseId: number, currentStatus: boolean) => {
        try {
            // Toggle the status locally first for immediate feedback
            const newStatus = !currentStatus;
            setCourses(prev => prev.map(c =>
                c.Id === courseId ? { ...c, CertificatesEnabled: newStatus } : c
            ));

            // Optimistic update
            await axios.put(`http://127.0.0.1:8000/api/courses/${courseId}`,
                { CertificatesEnabled: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setToast({ message: `Certificates ${newStatus ? 'enabled' : 'disabled'} for course.`, type: 'success' });
        } catch (error) {
            console.error('Error updating status:', error);
            setToast({ message: 'Failed to update certificate status.', type: 'error' });
            // Revert changes on error
            setCourses(prev => prev.map(c =>
                c.Id === courseId ? { ...c, CertificatesEnabled: currentStatus } : c
            ));
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Certificate Management</h1>
                <p className="text-gray-600">Enable or disable certificate generation for your courses.</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificates</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map(course => (
                            <tr key={course.Id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{course.Title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{course.instructor?.Name || 'Me'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={course.CertificatesEnabled}
                                            onChange={() => handleToggle(course.Id, course.CertificatesEnabled)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            {course.CertificatesEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </td>
                            </tr>
                        ))}
                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                    No courses found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CertificateManagement;
