import React from 'react';

const LoadingSpinner = ({ message = "Memuat...", size = "medium" }) => {
  const sizeClasses = {
    small: "spinner-small",
    medium: "spinner-medium",
    large: "spinner-large"
  };

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;