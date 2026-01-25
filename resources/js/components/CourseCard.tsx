import React from 'react';
import { Link } from 'react-router-dom';

interface Course {
    Id: number;
    Title: string;
    ShortDescription: string;
    Category: string;
    Difficulty: string;
    IsEnrolled?: boolean;
    Instructor: {
        Name: string;
    };
    FirstLessonId: number | null;
    ProgressPercentage?: number;
}

interface CourseCardProps {
    course: Course;
    onEnroll?: (courseId: number) => void;
}

const CourseCard = ({ course, onEnroll }: CourseCardProps) => {
    const isEnrolled = course.IsEnrolled ?? (course.ProgressPercentage !== undefined);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 flex flex-col h-full">
            <div className="flex-grow">
                <h2 className="text-lg font-bold mb-2">{course.Title}</h2>
                <p className="text-gray-600 text-sm mb-3">{course.ShortDescription}</p>
                {course.Instructor && (
                    <p className="text-xs text-gray-500 mb-3">Taught by: {course.Instructor.Name}</p>
                )}
            </div>
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-gray-600">{course.Category}</span>
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${
                    course.Difficulty === 'Beginner' ? 'bg-green-500' :
                    course.Difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                    {course.Difficulty}
                </span>
            </div>
            {isEnrolled && course.ProgressPercentage !== undefined && (
                <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${course.ProgressPercentage}%` }}></div>
                    </div>
                    <p className="text-xs text-right mt-1">{Math.round(course.ProgressPercentage)}% Complete</p>
                </div>
            )}
            <div className="mt-auto">
                {isEnrolled ? (
                     <Link
                        to={`/courses/${course.Id}/lessons/${course.FirstLessonId}`}
                        className="block w-full text-center py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Continue Learning
                    </Link>
                ) : (
                    <button
                        onClick={() => onEnroll?.(course.Id)}
                        className="w-full py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                        Enroll Now
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseCard;
