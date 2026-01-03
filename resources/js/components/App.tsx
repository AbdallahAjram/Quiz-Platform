
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import MyCourses from './MyCourses';
import Profile from './Profile';
import DashboardHome from './DashboardHome';
import ManagementLayout from './ManagementLayout';
import UserManagement from './UserManagement';
import ManagementDashboard from './ManagementDashboard';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/dashboard"
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
                        <ProtectedRoute>
                            <ManagementLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ManagementDashboard />} />
                    <Route path="dashboard" element={<ManagementDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;
