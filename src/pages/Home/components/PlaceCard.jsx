// src/pages/Home/components/PlaceCard.jsx
import React from 'react';
import { MapPin, MessageSquare, Ticket, X, Navigation } from 'lucide-react';

const PlaceCard = ({ location, onClose, onChat, onTicket }) => {
  if (!location) return null;

  return (
    <div className="absolute bottom-24 right-6 w-80 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-fade-in-up z-30">
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 text-blue-400 border border-blue-500/30">
          <MapPin size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white leading-tight">{location.name}</h3>
          <p className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-1">
             <Navigation size={10} /> 
             {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={() => onChat(location.name)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-700 hover:border-gray-500"
        >
          <MessageSquare size={16} className="text-blue-400" />
          <span className="text-sm font-medium">AI에게 정보 묻기</span>
        </button>

        <button 
          onClick={onTicket}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <Ticket size={16} />
          <span className="text-sm font-bold">이곳으로 계획 세우기</span>
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;