// app/components/Preloader.tsx
import React from 'react';

const Preloader: React.FC = () => {
    return (
        <div className='p-32'>

       
        <div className="relative inset-0 flex items-center justify-center z-20 ">
            <div className="w-8 h-8 border-4 border-teal-400 border-dashed rounded-full animate-spin"></div>
        </div> 
        
    </div>
    );
};

export default Preloader;
