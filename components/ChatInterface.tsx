import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { VoiceRecognitionService, VoiceRecognitionState, VoiceRecognitionResult } from '../services/voiceService';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
<<<<<<< HEAD
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Removed auto-scroll behavior - chat will stay in current position

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollButton(!isNearBottom());
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
=======
  const [voiceState, setVoiceState] = useState<VoiceRecognitionState>({
    isSupported: false,
    isListening: false,
    isProcessing: false,
    interimTranscript: '',
    finalTranscript: '',
    error: null
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceServiceRef = useRef<VoiceRecognitionService | null>(null);

  // Initialize voice recognition service
  useEffect(() => {
    const voiceService = new VoiceRecognitionService();
    voiceServiceRef.current = voiceService;

    // Set up event handlers
    voiceService.onStateChange((state) => {
      setVoiceState(state);
    });

    voiceService.onResult((result: VoiceRecognitionResult) => {
      if (result.isFinal) {
        setInput(prev => prev + result.transcript);
      }
    });

    voiceService.onError((error) => {
      console.error('Voice recognition error:', error);
    });

    // Set initial state
    setVoiceState(voiceService.getState());

    return () => {
      voiceService.cleanup();
    };
  }, []);

  // Update language when voiceLanguage changes
  useEffect(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.setLanguage(voiceLanguage);
    }
  }, [voiceLanguage]);

  const toggleVoiceRecognition = useCallback(() => {
    if (!voiceServiceRef.current) return;

    if (voiceState.isListening) {
      voiceServiceRef.current.stopListening();
    } else {
      voiceServiceRef.current.startListening();
    }
  }, [voiceState.isListening]);
>>>>>>> 452486482d02d81111a1d1de5812032b536c99e4

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
<<<<<<< HEAD
    <div className="w-full max-w-2xl mx-auto mt-4 h-[50vh] flex flex-col bg-slate-800/50 rounded-2xl border border-slate-700 shadow-lg">
      <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto relative">
=======
    <div className="w-full max-w-2xl mx-auto mt-4 h-[50vh] flex flex-col bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-600/50 shadow-2xl">
      {/* Voice Status Bar */}
      {voiceState.isListening && (
        <div className="px-6 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-b border-red-400/30">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-sm font-medium">Listening...</span>
            </div>
            {voiceState.interimTranscript && (
              <span className="text-slate-300 text-sm italic truncate max-w-xs">
                "{voiceState.interimTranscript}"
              </span>
            )}
          </div>
        </div>
      )}

      {/* Voice Error Display */}
      {voiceState.error && (
        <div className="px-6 py-2 bg-red-500/20 border-b border-red-400/30">
          <p className="text-red-300 text-sm">{voiceState.error}</p>
        </div>
      )}

      <div className="flex-1 p-6 overflow-y-auto">
>>>>>>> 452486482d02d81111a1d1de5812032b536c99e4
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="text-slate-400 text-lg font-medium">Welcome to your AI therapy session</p>
              <p className="text-slate-500 text-sm mt-2">Share what's on your mind or use voice input</p>
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 group`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl break-words transition-all duration-300 hover:scale-105 ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg' 
                : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-lg border border-slate-600/50'
            }`}>
              <p className="text-base leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-lg border border-slate-600/50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse [animation-delay:0.4s]"></div>
                <span className="text-slate-400 text-sm ml-2">Tessa is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 z-10"
            aria-label="Scroll to bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <div className="px-6 py-4 bg-slate-700/50 border-t border-slate-600/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-200 text-sm font-medium">Voice Settings</h3>
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-slate-300 text-sm font-medium">Language:</label>
            <select 
              value={voiceLanguage} 
              onChange={(e) => setVoiceLanguage(e.target.value)}
              className="bg-slate-600 border border-slate-500 rounded-lg px-3 py-1 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-BR">Portuguese</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="zh-CN">Chinese</option>
            </select>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 border-t border-slate-600/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share what's on your mind..."
            disabled={isLoading}
            className="w-full bg-slate-700/80 border border-slate-600/50 rounded-full py-3 pl-5 pr-20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            aria-label="Chat message input"
          />
          
          {/* Voice Controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Voice Settings Button */}
            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="Voice settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Voice Recognition Button */}
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              disabled={!voiceState.isSupported || isLoading}
              className={`p-2 rounded-full transition-all duration-200 ${
                voiceState.isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : voiceState.isSupported
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              title={voiceState.isSupported ? (voiceState.isListening ? 'Stop listening' : 'Start voice input') : 'Voice not supported'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5a.75.75 0 001.5 0v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 11-9 0v-.357z" />
              </svg>
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:scale-105"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.826L11.25 9.25v1.5l-7.5 1.547a.75.75 0 00-.95.826l-1.414 4.95a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
