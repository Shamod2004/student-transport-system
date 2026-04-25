import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-soft border border-gray-100 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200"></div>
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Route Name */}
        <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
        
        {/* Route Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
        
        {/* Price and Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-12 bg-gray-200 rounded-lg w-20"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
