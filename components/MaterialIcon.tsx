import React from 'react';

interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: string;
  size?: number;
  filled?: boolean;
}

const MaterialIcon: React.FC<MaterialIconProps> = ({ 
  icon, 
  className = '', 
  size = 24, 
  filled = false,
  style,
  ...props 
}) => {
  return (
    <span 
      className={`material-symbols-outlined select-none ${className}`}
      style={{ 
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        ...style
      }}
      {...props}
    >
      {icon}
    </span>
  );
};

export default MaterialIcon;