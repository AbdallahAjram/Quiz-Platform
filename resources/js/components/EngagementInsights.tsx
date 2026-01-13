import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrainCircuit } from 'lucide-react';

interface EngagementInsight {
    CourseName: string;
    AverageScore: number | null;
    CompletionRate: number;
    EnrolledCount: number;
}

const EngagementInsights = () => {
    const [insights, setInsights] = useState<EngagementInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/analytics/engagement-insights', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setInsights(response.data);
            } catch (err) {
                setError('Failed to fetch engagement insights.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [token]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><BrainCircuit className="animate-pulse" /></div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-6 bg-white text-gray-900 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 flex items-center"><BrainCircuit className="mr-3" /> Engagement Insights</h1>
            
            <h2 className="text-2xl font-bold mb-4">Average Scores per Course</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={insights}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="CourseName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="AverageScore" fill="#8884d8" name="Average Score (%)" />
                </BarChart>
            </ResponsiveContainer>

            <h2 className="text-2xl font-bold mt-8 mb-4">Course Completion Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.filter(i => i.EnrolledCount > 0).map((insight, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg shadow">
                        <h3 className="text-xl font-bold">{insight.CourseName}</h3>
                        <p className="text-lg mt-2">Completion Rate: <span className="font-bold">{insight.CompletionRate.toFixed(2)}%</span></p>
                        <p className="text-sm text-gray-600">{insight.EnrolledCount} students enrolled</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EngagementInsights;
