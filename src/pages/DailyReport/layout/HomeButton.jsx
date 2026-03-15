import React from 'react';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeButton = () => {
  return (
    <div className="px-6 pt-5 pb-0 flex justify-between items-center">
      <Link 
        to="/" 
        className="text-gray-500 hover:text-blue-500 transition-colors p-2 -ml-2 hover:bg-gray-100 rounded-full group" 
        title="Go Home (Return to Globe)"
      >
        <Globe size={20} className="group-hover:rotate-180 transition-transform duration-700 ease-in-out"/>
      </Link>
    </div>
  );
};

export default HomeButton;