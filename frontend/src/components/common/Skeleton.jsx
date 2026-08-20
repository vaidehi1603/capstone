import React from 'react';

export const Skeleton = ({ className = '', rows = 1 }) => {
  if (rows > 1) {
    return (
      <div className="space-y-3 w-full animate-pulse">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className={`h-4 bg-slate-800/80 rounded-lg ${idx === rows - 1 ? 'w-3/4' : 'w-full'} ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />
  );
};
