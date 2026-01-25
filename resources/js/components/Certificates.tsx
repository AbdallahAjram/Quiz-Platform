import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Toast from './Toast';

interface Course {
    Id: number;
    Title: string;
    ProgressPercentage: number;
    isEligibleForCertificate: boolean;
    CertificateId: number | null;
    DownloadUrl: string | null;
}

const Certificates = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const token = localStorage.getItem('token');

    const fetchMyCourses = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/enrollments/my-courses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCourses(response.data || []);
        } catch (error) {
            console.error('Failed to fetch course data:', error);
            setToast({ message: 'Failed to load your course data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, [token]);

    const handleDownload = (downloadUrl: string | null) => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        } else {
            setToast({ message: 'Download URL is not available yet. Please try again shortly.', type: 'error' });
        }
    };

    const handleClaim = async (courseId: number) => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/certificates/claim`, { CourseId: courseId }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setToast({ message: 'Certificate claimed successfully! It will be available for download shortly.', type: 'success' });
            // Refresh courses to get the new certificate ID and download URL
            fetchMyCourses();
        } catch (error) {
            console.error('Failed to claim certificate:', error);
            setToast({ message: 'Failed to claim certificate. You may not be eligible yet.', type: 'error' });
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const eligibleCourses = courses.filter(c => c.isEligibleForCertificate || c.CertificateId);

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-2xl font-semibold mb-4">My Certificates</h1>
            {eligibleCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eligibleCourses.map(course => (
                        <div key={course.Id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-2">{course.Title}</h2>
                                <p className="text-gray-600 mb-4">Course Completed!</p>
                                {course.DownloadUrl ? (
                                    <button
                                        onClick={() => handleDownload(course.DownloadUrl)}
                                        className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Download Certificate
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleClaim(course.Id)}
                                        className="w-full py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                                        disabled={!course.isEligibleForCertificate}
                                    >
                                        Claim Certificate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-gray-600 text-lg mb-4">You haven't earned any certificates yet. Keep learning to unlock your rewards!</p>
                    <Link to="/dashboard/courses/browse" className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Browse Courses
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Certificates;