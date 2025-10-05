import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
          <p className="font sub">We're here to listen and support you.</p>
        </div>
        
        <div style={{ width: '100%', display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <CameraFeed 
              ref={cameraRef} 
              onStreamReady={() => { console.log('Camera ready.') }}
              onError={(err) => handleError("Camera access denied or not available. Please check permissions.", true)}
            />
            {error && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', borderRadius: '0.5rem', color: 'var(--dark_green)' }}>
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
    </>
  );
};

export default App;