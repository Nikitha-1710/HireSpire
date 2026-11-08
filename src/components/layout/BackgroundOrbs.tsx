import React from 'react';

export const BackgroundOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Deep subtle ambient gradient mesh */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-900/15 via-blue-900/10 to-transparent blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-purple-900/15 via-indigo-900/10 to-transparent blur-[140px]" />
      <div className="absolute top-[35%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-r from-cyan-900/10 via-emerald-900/5 to-transparent blur-[100px]" />
      
      {/* Subtle modern geometric grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
};
