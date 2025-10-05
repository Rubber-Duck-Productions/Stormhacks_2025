import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChatMessage } from '../types';
import CameraFeed, { CameraFeedHandle } from './CameraFeed';
import ChatInterface from './ChatInterface';
import { analyzeFacialExpression, getChatbotResponse } from '../services/geminiService';

const Chatbot: React.FC = () => {
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

    try {
      // Add user message immediately
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      // Start generating initial response immediately
      const initialResponsePromise = getChatbotResponse(message, null);

      // Try to capture facial expression quickly (max 2 attempts)
      let base64Image = null;
      for (let i = 0; i < 2; i++) {
        base64Image = cameraRef.current.captureFrame();
        if (base64Image) break;
        if (i < 1) await new Promise(resolve => setTimeout(resolve, 50)); // Very short retry delay
      }

      // If we couldn't get the image, use the initial response
      if (!base64Image) {
        const response = await initialResponsePromise;
        setMessages(prev => [...prev, { role: 'model', content: response }]);
        return;
      }

      // Start emotion analysis while initial response is being generated
      const [detectedEmotion, initialResponse] = await Promise.all([
        analyzeFacialExpression(base64Image),
        initialResponsePromise
      ]);

      // If we have emotion data, get enhanced response
      if (detectedEmotion) {
        const enhancedResponse = await getChatbotResponse(message, detectedEmotion);
        setMessages(prev => [...prev, { role: 'model', content: enhancedResponse }]);
      } else {
        // Use the initial response if no emotion data
        setMessages(prev => [...prev, { role: 'model', content: initialResponse }]);
      }

    } catch (err) {
      handleError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="marquee-banner">
        <ul>
          <li>You're not alone</li>
          <li>One day at a time</li>
          <li>Be gentle with yourself. You're doing the best you can</li>
          <li>Self-care is not selfish; it's how you take your power back.</li>
          <li>Sometimes the bravest thing you can do is ask for help</li>
        </ul>
      </div>

      <div className="Nav">
        <div>
          <Link to="/"><button className="font Home b1">Home</button></Link>
        </div>
        <div className="Logs">
          <button className="font b1">Anonymous</button>
          <button className="font b1">Log In</button>
        </div>
      </div>

      <div className="MainContent">
        <div className="text">
          <h1 className="font head">Your AI Therapy Session</h1>
          <p className="font sub">We're here to listen and support you. Experience therapy with advanced voice recognition and facial expression analysis.</p>
          <div className="mt-6 flex justify-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-400">
                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5a.75.75 0 001.5 0v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 11-9 0v-.357z" />
              </svg>
              <span className="text-slate-300 text-sm">Voice-to-Text</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-400">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-300 text-sm">Facial Analysis</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-400">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-300 text-sm">Secure & Private</span>
            </div>
          </div>
        </div>
        
        <div className="therapy-session-container" style={{ width: '100%', display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <CameraFeed 
              ref={cameraRef} 
              onStreamReady={() => { console.log('Camera ready.') }}
              onError={(err) => handleError("Camera access denied or not available. Please check permissions.", true)}
            />
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <ChatInterface 
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="ThirdContent">
        <div className="text3">
          <h2>Your Privacy is Our Priority</h2>
          <p className="textBot3">
            All conversations are encrypted and private. Your mental health journey stays between you and our AI.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-col">
          <p>Our GitHub</p>
          <p className="fab fa-github"></p>
          <a href="https://github.com/Rubber-Duck-Productions" target="_blank" rel="noopener noreferrer">Rubber Duck Productions</a>
        </div>
        <div className="footer-col">
          <p>Our Story</p>
          <a href="AboutUs.html">Learn More</a>
        </div>
        <div className="footer-col">
          <p>Home</p>
          <Link to="/">Return Home</Link>
        </div>
        <div className="footer-col">
          <p>Chatbot</p>
          <Link to="/chatbot">Try Now</Link>
        </div>
        <div className="footer-bottom">
          <p><i className="far fa-copyright"></i> 2025 Rubber Duck Productions. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Chatbot;
