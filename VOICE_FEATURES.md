# Voice-to-Text Integration for AI Therapy Chatbot

## 🎤 Overview

This implementation adds advanced voice-to-text functionality to the AI therapy chatbot using the Gemini API and Web Speech API. Users can now interact with the therapy chatbot using their voice, making the experience more natural and accessible.

## ✨ Features

### **Voice Recognition**
- **Real-time speech-to-text** using Web Speech API
- **Multi-language support** (English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese)
- **Continuous listening** with interim results
- **Confidence scoring** for transcription accuracy
- **Error handling** with user-friendly messages

### **Visual Feedback**
- **Live listening indicator** with pulsing animation
- **Real-time transcript display** showing interim results
- **Voice status bar** with recording state
- **Error notifications** for microphone issues

### **Voice Settings**
- **Language selection** dropdown
- **Voice settings panel** with easy access
- **Microphone permissions** handling
- **Browser compatibility** detection

### **Gemini API Integration**
- **Enhanced voice processing** using Gemini's audio capabilities
- **Fallback transcription** for better accuracy
- **Audio blob processing** for advanced features
- **Seamless integration** with existing therapy features

## 🚀 How to Use

### **Basic Voice Input**
1. Click the microphone button in the chat interface
2. Grant microphone permissions when prompted
3. Start speaking - you'll see real-time transcription
4. Click the microphone again to stop listening
5. Send your message using the send button

### **Voice Settings**
1. Click the settings (gear) icon next to the microphone
2. Select your preferred language from the dropdown
3. Close the settings panel when done

### **Supported Languages**
- English (US/UK)
- Spanish
- French
- German
- Italian
- Portuguese
- Japanese
- Korean
- Chinese

## 🛠 Technical Implementation

### **Components**
- `VoiceRecognitionService` - Core voice recognition logic
- `ChatInterface` - Enhanced UI with voice controls
- `AudioRecorder` - Audio recording utilities
- `processVoiceWithGemini` - Gemini API integration

### **Key Files**
- `services/voiceService.ts` - Voice recognition service
- `components/ChatInterface.tsx` - Enhanced chat interface
- `types/speech.d.ts` - TypeScript declarations
- `components/Chatbot.tsx` - Main chatbot component

### **Browser Support**
- Chrome/Chromium (full support)
- Safari (limited support)
- Firefox (limited support)
- Edge (full support)

## 🔧 Setup Requirements

### **Environment Variables**
```bash
API_KEY=your_gemini_api_key_here
```

### **Dependencies**
- `@google/genai` - Gemini API client
- React 19.2.0+
- TypeScript 5.8.2+

### **Browser Permissions**
- Microphone access required
- HTTPS recommended for production

## 🎯 Usage Examples

### **Starting Voice Recognition**
```typescript
const voiceService = new VoiceRecognitionService();
voiceService.startListening();
```

### **Handling Voice Results**
```typescript
voiceService.onResult((result) => {
  if (result.isFinal) {
    console.log('Final transcript:', result.transcript);
    console.log('Confidence:', result.confidence);
  }
});
```

### **Error Handling**
```typescript
voiceService.onError((error) => {
  console.error('Voice recognition error:', error);
});
```

## 🔒 Privacy & Security

- **No audio storage** - Voice data is processed in real-time only
- **Local processing** - Speech recognition happens in the browser
- **Secure transmission** - Only text transcripts are sent to Gemini API
- **Anonymous sessions** - No user data collection

## 🐛 Troubleshooting

### **Common Issues**
1. **Microphone not working**: Check browser permissions
2. **No speech detected**: Ensure microphone is not muted
3. **Poor accuracy**: Try speaking more clearly or closer to microphone
4. **Language not supported**: Check browser compatibility

### **Error Messages**
- `"Microphone not accessible"` - Check permissions
- `"No speech was detected"` - Try speaking louder
- `"Speech recognition not supported"` - Use supported browser
- `"Network error occurred"` - Check internet connection

## 🚀 Future Enhancements

- **Voice commands** for navigation
- **Audio visualization** with waveforms
- **Voice emotion detection** using Gemini
- **Offline voice recognition** capabilities
- **Custom wake words** for hands-free activation

## 📝 Notes

- Voice recognition works best in quiet environments
- Clear speech improves accuracy significantly
- Some browsers may require HTTPS for microphone access
- The implementation gracefully falls back to text input if voice is unavailable

---

*This voice-to-text implementation enhances the accessibility and user experience of the AI therapy chatbot, making mental health support more natural and inclusive.*
