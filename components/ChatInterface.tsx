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
  const [summaries, setSummaries] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const lastSpokenRef = useRef<string | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  
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

  // Cookie helpers (simple)
  // Local storage helpers with optional migration from cookie
  function loadSummariesFromStorage(): string[] {
    try {
      const raw = localStorage.getItem('chat_summaries');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as string[];
      }
    } catch (e) {
      // fallthrough to cookie migration
    }

    // migration: check cookie (if older clients stored there)
    try {
      const cookie = document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === 'chat_summaries' ? decodeURIComponent(parts[1]) : r;
      }, '');
      if (cookie) {
        const parsed = JSON.parse(cookie);
        if (Array.isArray(parsed)) {
          // write to localStorage and remove cookie string (cannot reliably delete in all contexts)
          try { localStorage.setItem('chat_summaries', JSON.stringify(parsed)); } catch (e) {}
          return parsed as string[];
        }
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  function saveSummariesToStorage(arr: string[]) {
    try {
      localStorage.setItem('chat_summaries', JSON.stringify(arr));
    } catch (e) {
      // ignore quota errors
    }
  }

  // Load summaries from localStorage (with migration from cookie)
  useEffect(() => {
    const arr = loadSummariesFromStorage();
    if (arr && arr.length) setSummaries(arr);
    try {
      const raw = localStorage.getItem('tts_enabled');
      if (raw !== null) setTtsEnabled(raw === '1');
      const sv = localStorage.getItem('eleven_voice_id');
      if (sv) setSelectedVoice(sv);
    } catch (e) {}
  }, []);

  // Manual summarization to avoid auto-calls
  const handleSummarize = async () => {
    if (isSummarizing) return;
    if (!messages || messages.length === 0) return;
    setIsSummarizing(true);
    try {
      const resp = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      if (!resp.ok) {
        console.error('Summarize request failed', resp.status);
        return;
      }
      const data = await resp.json();
      const summary = data.summary?.trim();
      if (summary) {
        // avoid duplicate consecutive summaries
        if (summaries.length === 0 || summaries[0] !== summary) {
          const newSummaries = [summary].concat(summaries).slice(0, 10);
          setSummaries(newSummaries);
          saveSummariesToStorage(newSummaries);
        }
      }
    } catch (e) {
      console.error('Failed to fetch summary', e);
    } finally {
      setIsSummarizing(false);
    }
  };

  // persist TTS preference
  useEffect(() => {
    try { localStorage.setItem('tts_enabled', ttsEnabled ? '1' : '0'); } catch (e) {}
  }, [ttsEnabled]);

  // speak a text using server-side TTS (/api/tts) if available, otherwise fallback to Web Speech API
  const speakText = async (text: string) => {
    if (!text || !text.trim()) return;
    // Try server-side ElevenLabs TTS
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice })
      });
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        // try play and revoke url afterwards
        await audio.play();
        audio.addEventListener('ended', () => { try { URL.revokeObjectURL(url); } catch (e) {} });
        return;
      }
    } catch (e) {
      console.warn('server TTS failed, falling back to speechSynthesis', e);
    }

    // Fallback: use browser SpeechSynthesis
    try {
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn('speechSynthesis failed', e);
    }
  };

  // load available voices from server
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/voices');
        if (!r.ok) return;
        const body = await r.json();
        const list = Array.isArray(body.voices) ? body.voices : (body as any[]);
        setVoices(list || []);
        // try to pick a reasonable british female default if none selected
        if (!selectedVoice && list && list.length) {
          const br = list.find((v:any) => /british|uk|en-?gb/i.test((v.name || v.voice || '') ) && /female|woman/i.test((v.gender || v.voice_gender || '') + '')) || list.find((v:any) => /female|woman/i.test((v.gender || v.voice_gender || '') + ''));
          if (br) {
            setSelectedVoice(br.id || br.voice_id || br.voice || br.name);
            try { localStorage.setItem('eleven_voice_id', (br.id || br.voice_id || br.voice || br.name) as string); } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Failed to load voices', e);
      }
    })();
  }, []);

  // When new messages arrive, speak the latest assistant reply if TTS is enabled
  useEffect(() => {
    if (!ttsEnabled) return;
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== 'model') return;
    // avoid repeating same speech
    if (lastSpokenRef.current === last.content) return;
    lastSpokenRef.current = last.content;
    // play asynchronously (no await to avoid blocking UI)
    speakText(last.content).catch(e => console.error('speakText error', e));
  }, [messages, ttsEnabled]);

  const toggleVoiceRecognition = useCallback(() => {
    if (!voiceServiceRef.current) return;

    if (voiceState.isListening) {
      voiceServiceRef.current.stopListening();
    } else {
      voiceServiceRef.current.startListening();
    }
  }, [voiceState.isListening]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl rounded-3xl border border-slate-600/60 shadow-2xl chat-shell">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-950/60 to-slate-900/60 border-b border-slate-700/60 rounded-t-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                <path d="M18 13a3 3 0 00-3-3H9a3 3 0 00-3 3v2a2 2 0 002 2h8a2 2 0 002-2v-2z" />
                <path d="M9 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-100 font-semibold">Lux</span>
                <span className="inline-flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-300 text-xs">online</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs">Empathetic AI therapist</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-slate-400">
            <div className="relative">
              {/* Voice selector (prefers ElevenLabs voices) */}
              <select
                value={selectedVoice || ''}
                onChange={(e) => { setSelectedVoice(e.target.value); try { localStorage.setItem('eleven_voice_id', e.target.value); } catch (e) {} }}
                className="mr-2 bg-slate-700/40 text-slate-100 px-2 py-1 rounded-md text-sm"
                title="Select TTS voice"
              >
                <option value="">Default voice</option>
                {voices.map(v => (
                  <option key={v.id || v.voice || v.name} value={v.id || v.voice || v.name}>{v.name || v.voice || v.id}</option>
                ))}
              </select>
              <button
                type="button"
                className="text-slate-300 hover:text-white hover:bg-slate-700/60 px-3 py-1 rounded-md"
                onClick={(e) => {
                  const el = document.getElementById('summariesMenu');
                  if (el) el.classList.toggle('show');
                }}
                aria-haspopup="true"
                aria-expanded={summaries.length > 0}
              >
                Summaries <span className="ml-1 text-xs">▾</span>
              </button>
              <button
                type="button"
                className="ml-2 text-slate-200 bg-slate-700/40 hover:bg-slate-700/60 px-3 py-1 rounded-md text-sm"
                onClick={handleSummarize}
                disabled={isSummarizing}
                title="Generate a short summary of the conversation"
              >
                {isSummarizing ? 'Summarizing…' : 'Summarize'}
              </button>
              {/* TTS toggle */}
              <button
                type="button"
                onClick={() => setTtsEnabled(v => !v)}
                className={`ml-2 px-3 py-1 rounded-md text-sm ${ttsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700/30 text-slate-300'}`}
                title={ttsEnabled ? 'Disable speech' : 'Enable speech'}
              >
                {ttsEnabled ? 'Voice On' : 'Voice Off'}
              </button>
              <div id="summariesMenu" className="absolute right-0 mt-2 w-64 bg-slate-800/95 border border-slate-700 rounded-lg shadow-lg p-2 hidden z-40">
                {summaries.length === 0 && <div className="text-slate-400 text-sm px-2 py-1">No summaries yet</div>}
                {summaries.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // insert summary into chat input
                      setInput(prev => (prev ? prev + '\n' + s : s));
                      // close menu
                      const el = document.getElementById('summariesMenu'); if (el) el.classList.remove('show');
                    }}
                    className="w-full text-left text-slate-200 text-sm px-2 py-2 hover:bg-slate-700 rounded-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10.5 1.5a4 4 0 00-4 4V8H5a2.5 2.5 0 00-2.5 2.5v5A2.5 2.5 0 005 18h10a2.5 2.5 0 002.5-2.5v-5A2.5 2.5 0 0015 8h-1.5V5.5a4 4 0 00-4-4zm-2.5 6.5V5.5a2.5 2.5 0 115 0V8h-5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Secure session</span>
          </div>
        </div>
      </div>
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

      <div className="flex-1 p-6 overflow-y-auto chat-scroll">
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
            <div className={`max-w-[72%] px-4 py-3 rounded-2xl break-words transition-all duration-300 hover:shadow-xl ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg border border-cyan-400/30' 
                : 'bg-slate-800/80 text-slate-100 shadow-lg border border-slate-600/60'
            }`}>
              <p className="text-[0.95rem] leading-relaxed tracking-[0.005em]">{msg.content}</p>
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
                <span className="text-slate-400 text-sm ml-2">Lux is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
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

      <form onSubmit={handleSend} className="p-4 border-t border-slate-700/60 bg-slate-900/40 rounded-b-3xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share what's on your mind..."
            disabled={isLoading}
            className="w-full bg-slate-800/70 border border-slate-600/60 rounded-full py-3 pl-5 pr-24 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-md shadow-inner"
            aria-label="Chat message input"
          />
          
          {/* Voice Controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Voice Settings Button */}
            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors hover:bg-slate-700/60 rounded-full"
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
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700/70'
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
              className="bg-gradient-to-r from-cyan-500 to-sky-600 text-white rounded-full p-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-all duration-200 hover:scale-105 shadow-md"
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
