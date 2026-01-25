import React, { useState } from 'react';
import axios from 'axios';

interface VerificationResult {
    StudentName: string;
    CourseTitle: string;
    IssueDate: string;
    Platform: string;
}

const CertificateVerification: React.FC = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Using the public route we just created
            const response = await axios.get(`/api/certificates/verify/${code}`);
            setResult(response.data.data);
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                setError('Invalid Verification Code. Please check and try again.');
            } else {
                setError('An error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Verify Certificate</h2>
            
            <form onSubmit={handleVerify} className="space-y-4">
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter code (e.g., AB123XYZ)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition transition-all"
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                        loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {loading ? 'Verifying...' : 'Check Authenticity'}
                </button>
            </form>

            {/* Results Section */}
            <div className="mt-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-center animate-pulse">
                        <svg className="w-6 h-6 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {result && (
                    <div className="p-5 bg-green-50 border border-green-200 rounded-md text-center">
                        <svg className="w-10 h-10 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-bold text-green-800 mb-2">Valid Certificate</h3>
                        
                        <div className="text-sm text-gray-700 space-y-2 text-left bg-white p-3 rounded border border-green-100 shadow-sm">
                            <p><span className="font-semibold text-gray-500">Student:</span> <span className="text-gray-900">{result.StudentName}</span></p>
                            <p><span className="font-semibold text-gray-500">Course:</span> <span className="text-gray-900">{result.CourseTitle}</span></p>
                            <p><span className="font-semibold text-gray-500">Issued On:</span> <span className="text-gray-900">{result.IssueDate}</span></p>
                            <p><span className="font-semibold text-gray-500">Platform:</span> <span className="text-gray-900">{result.Platform}</span></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificateVerification;
