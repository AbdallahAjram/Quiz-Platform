import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import MyCourses from './MyCourses';
import Profile from './Profile';
import DashboardHome from './DashboardHome';
import ManagementLayout from './ManagementLayout';
import ManagementDashboard from './ManagementDashboard';
import UserManagement from './UserManagement';
import CreateCourse from './CreateCourse';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return children;
};

const ManagementRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (user.Role !== 'Admin' && user.Role !== 'Instructor') {
        // Redirect to student dashboard or a 'not authorized' page
        return <Navigate to="/student/dashboard" />;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/student/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardHome />} />
                    <Route path="courses" element={<MyCourses />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
                <Route
                    path="/management"
                    element={
                        <ManagementRoute>
                            <ManagementLayout />
                        </ManagementRoute>
                    }
                >
                    <Route path="dashboard" element={<ManagementDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="courses" element={<MyCourses />} />
                    <Route path="courses/create" element={<CreateCourse />} />
                    {/* Add other management routes here */}
                </Route>
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;