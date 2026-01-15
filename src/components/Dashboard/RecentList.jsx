import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Loader2 } from 'lucide-react';

const RecentList = ({ reports, loading }) => {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText size={20} /> 최근 작성 목록
      </h3>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[200px] flex flex-col justify-center items-center p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">아직 작성된 일보가 없습니다.</p>
          <Link to="/report/write" className="text-blue-600 hover:underline text-sm font-medium">
            첫 기록을 남겨보세요 &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Link 
              to={`/report/${report.id}`} 
              key={report.id} 
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {report.date}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {report.location}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h4>
                <p className="text-gray-500 text-sm mt-1 truncate">
                  {report.content}
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-blue-500 ml-4">
                &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentList;