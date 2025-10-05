import React, { useState, useRef, useCallback } from 'react';
import { ChatMessage } from './types';
import CameraFeed, { CameraFeedHandle } from './components/CameraFeed';
import ChatInterface from './components/ChatInterface';
import { analyzeFacialExpression, getChatbotResponse } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraFeedHandle>(null);

  const handleError = useCallback((message: string, isFatal: boolean = false) => {
    console.error(message);
    setError(message);
    if (!isFatal) {
        setMessages(prev => [...prev, { role: 'model', content: `Sorry, an error occurred: ${message}` }]);
    }
    setIsLoading(false);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!cameraRef.current) {
      handleError("Camera is not available.", true);
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const base64Image = cameraRef.current.captureFrame();
      if (!base64Image) {
        handleError("Could not capture frame from camera.");
        return;
      }

      const detectedEmotion = await analyzeFacialExpression(base64Image);
      
      const botResponse = await getChatbotResponse(message, detectedEmotion);
      setMessages(prev => [...prev, { role: 'model', content: botResponse }]);

    } catch (err) {
      handleError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 font-sans bg-slate-900">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
          Zenith AI Therapist
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
          Your AI companion that understands both your words and your feelings.
        </p>
      </header>
      
      <main className="w-full flex flex-col items-center">
        <CameraFeed 
          ref={cameraRef} 
          onStreamReady={() => { console.log('Camera ready.') }}
          onError={(err) => handleError("Camera access denied or not available. Please check permissions.", true)}
        />
        {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg w-full max-w-2xl mx-auto">{error}</div>}
        <ChatInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
      
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>This is a proof-of-concept application. AI-generated advice is not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
};

export default App;
