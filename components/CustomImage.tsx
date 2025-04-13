import React from 'react';

interface CustomImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  unoptimized?: boolean;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Обертка для изображений, использующая обычный HTML img
 * вместо компонента Next.js Image для избежания ошибок с доменами
 */
export function CustomImage({
  src, 
  alt, 
  width,
  height,
  className = '',
  onLoad,
  onError,
  fill,
}: CustomImageProps) {
  
  let imgStyle: React.CSSProperties = {};
  let divStyle: React.CSSProperties = {};
  
  if (fill) {
    divStyle = {
      position: 'relative',
      width: '100%',
      height: '100%',
    };
    
    imgStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };
  } else {
    imgStyle = {
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : 'auto',
    };
  }

  if (fill) {
    return (
      <div style={divStyle}>
        <img 
          src={src} 
          alt={alt} 
          style={imgStyle}
          className={className}
          onLoad={onLoad}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      style={imgStyle}
      className={className}
      onLoad={onLoad}
      onError={onError}
    />
  );
} 