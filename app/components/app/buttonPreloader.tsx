// app/components/Preloader.tsx
import React from 'react';

const Preloader: React.FC = () => {
    return (
      <div className="w-5 h-5 border-2 mr-2 border-teal-400 border-dashed rounded-full animate-spin"></div>    
    );
};

export default Preloader;