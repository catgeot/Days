import React from 'react';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeButton = () => {
  return (
    <div className="px-6 pt-5 pb-0 flex justify-between items-center">
      <Link
        to="/"
        className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors p-2 -ml-2 hover:bg-gray-100 rounded-lg group"
        title="Go Home (Return to Globe)"
      >
        <Home size={20} className="group-hover:-translate-y-1 transition-transform duration-300 ease-in-out"/>
        <span className="text-sm font-bold tracking-tight">홈으로</span>
      </Link>
    </div>
  );
};

export default HomeButton;
