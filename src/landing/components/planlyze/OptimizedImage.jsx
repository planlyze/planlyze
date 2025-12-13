import React, { useState } from 'react';

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  loading = 'lazy',
  decoding = 'async'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Add optimization parameters for external images
  const optimizedSrc = src.includes('unsplash.com') 
    ? `${src}&w=${width || 800}&q=75&fm=webp`
    : src;

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  );
}
