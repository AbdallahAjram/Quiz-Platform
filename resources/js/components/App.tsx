
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
import ProtectedRoute from './ProtectedRoute';
import CourseManagement from "./CourseManagement";
import CourseForm from "./CourseForm";
import BrowseCourses from "./BrowseCourses";
import EditCourse from "./EditCourse";
import LessonManagement from "./LessonManagement";
import ManageQuizzes from "./ManageQuizzes";
import QuizAnalytics from "./QuizAnalytics";
import QuizStudentStats from "./QuizStudentStats";
import TakeQuiz from "./TakeQuiz";

import LessonViewer from "./LessonViewer";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute roles={['Student']}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardHome />} />
                    <Route path="courses" element={<MyCourses />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="courses/browse" element={<BrowseCourses />} />
                </Route>
                <Route
                    path="/management"
                    element={
                        <ProtectedRoute roles={['Admin', 'Instructor']}>
                            <ManagementLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<ManagementDashboard />} />
                    <Route path="dashboard" element={<ManagementDashboard />} />
                    <Route path="users" element={<ProtectedRoute roles={['Admin']}><UserManagement /></ProtectedRoute>} />
                    <Route path="courses" element={<CourseManagement />} />
                    <Route path="courses/create" element={<CourseForm />} />
                    <Route path="courses/edit/:Id" element={<EditCourse />} />
                    <Route path="courses/:courseId/lessons" element={<LessonManagement />} />
                    <Route path="analytics" element={<QuizAnalytics />} />
                    <Route path="quizzes" element={<QuizAnalytics />} />
                    <Route path="quizzes/:lessonId" element={<ManageQuizzes />} />
                    <Route path="quizzes/course/:courseId" element={<ManageQuizzes />} />
                    <Route path="quizzes/:quizId/students" element={<QuizStudentStats />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="/courses/:courseId/lessons" element={<ProtectedRoute roles={['Student']}><LessonViewer /></ProtectedRoute>} />
                <Route path="/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute roles={['Student']}><LessonViewer /></ProtectedRoute>} />
                <Route path="/quizzes/take/:quizId" element={<ProtectedRoute roles={['Student']}><TakeQuiz /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};


export default App;
