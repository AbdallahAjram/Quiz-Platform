
import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    onClose: () => void;
    type: 'success' | 'error';
}

const Toast = ({ message, onClose, type }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white";
    const typeClasses = {
        success: "bg-green-500",
        error: "bg-red-500",
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {message}
        </div>
    );
};

export default Toast;
