// src/components/PlaceCard/PlaceCardCompact.jsx
import React from 'react';
import { X, Globe } from 'lucide-react';

const PlaceCardCompact = ({ location, onClose }) => {
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in transition-all duration-300 pointer-events-none">
       <div className="pointer-events-auto bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
             <Globe size={14} className="text-blue-400" />
             <span className="text-sm font-bold text-white">{location.name}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-gray-500 transition-colors">
            <X size={12}/>
          </button>
       </div>
    </div>
  );
};

export default PlaceCardCompact;