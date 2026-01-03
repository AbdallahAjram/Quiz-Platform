import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }: { children: JSX.Element, roles: string[] }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        return <Navigate to="/login" />;
    }

    console.log('User from localStorage:', user);
    console.log('Required roles:', roles);

    if (roles && !roles.includes(user.Role)) {
        console.log(`Redirecting because user role "${user.Role}" is not in "${roles.join(',')}"`);
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
