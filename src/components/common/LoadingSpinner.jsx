import React from 'react';

const LoadingSpinner = ({ message = "Memuat...", size = "medium" }) => {
  const sizeMap = {
    small: "w-5 h-5 border-2",
    medium: "w-8 h-8 border-[3px]",
    large: "w-12 h-12 border-4",
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-xl">
      <div
        className={`${spinnerSize} rounded-full border-outline-variant border-t-primary animate-spin mb-md`}
      />
      <p className="text-body-sm font-body text-on-surface-variant animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;