
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-lg font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm md:text-base";
  
  const variants = {
    primary: "bg-[#EAB308] text-black hover:bg-[#d9a406] shadow-[0_0_15px_rgba(234,179,8,0.3)]",
    secondary: "bg-neutral-800 text-white hover:bg-neutral-700",
    outline: "border-2 border-[#EAB308] text-[#EAB308] hover:bg-[#EAB308] hover:text-black"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
