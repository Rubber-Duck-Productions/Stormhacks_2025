
import React from 'react';
import { AppState } from '../types';

interface StatusDisplayProps {
  state: AppState;
  emotion: string | null;
  advice: string | null;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-6 w-6 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const StatusDisplay: React.FC<StatusDisplayProps> = ({ state, emotion, advice, error }) => {
  const getStatusContent = () => {
    if (error) {
      return { icon: ' M6 18L18 6M6 6l12 12', text: error, color: 'text-red-400' };
    }
    
    switch (state) {
      case AppState.IDLE:
        return { icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z', text: "Click 'Begin Session' to start", color: 'text-slate-400' };
      case AppState.INITIALIZING:
         return { icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', text: 'Initializing camera and microphone...', color: 'text-sky-400' };
      case AppState.ANALYZING:
        return { loading: true, text: 'Analyzing your expression...', color: 'text-sky-400' };
      case AppState.GENERATING:
        return { loading: true, text: `Detected: ${emotion}. Generating advice...`, color: 'text-teal-400' };
      case AppState.SPEAKING:
        return { icon: 'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424', text: 'Speaking your personalized advice...', color: 'text-cyan-400' };
      default:
        return { icon: '', text: '', color: '' };
    }
  };

  const { icon, text, color, loading } = getStatusContent();

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 text-center min-h-[100px] p-6 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col justify-center items-center">
      <div className={`flex items-center justify-center space-x-3 ${color} mb-4`}>
        {loading ? <LoadingSpinner /> : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        )}
        <span className="text-lg font-medium">{text}</span>
      </div>
      {advice && (
        <p className="text-xl text-slate-200 font-light italic text-center">
          "{advice}"
        </p>
      )}
    </div>
  );
};

export default StatusDisplay;
