import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  isProcessing: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
}

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onStateChangeCallback?: (state: VoiceRecognitionState) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateState({ isListening: true, error: null });
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateState({ isListening: false, isProcessing: false });
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        const errorMessage = this.getErrorMessage(event.error);
        this.updateState({ 
          isListening: false, 
          isProcessing: false,
          error: errorMessage
        });
        this.onErrorCallback?.(errorMessage);
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            this.onResultCallback?.({
              transcript: finalTranscript,
              confidence,
              isFinal: true
            });
          } else {
            interimTranscript += transcript;
            this.onResultCallback?.({
              transcript: interimTranscript,
              confidence,
              isFinal: false
            });
          }
        }

        this.updateState({
          interimTranscript,
          finalTranscript: this.getState().finalTranscript + finalTranscript
        });
      };
    }
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'No speech was detected. Please try again.';
      case 'audio-capture':
        return 'Microphone not accessible. Please check permissions.';
      case 'not-allowed':
        return 'Microphone access denied. Please allow microphone access.';
      case 'network':
        return 'Network error occurred. Please check your connection.';
      case 'aborted':
        return 'Speech recognition was aborted.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }

  private updateState(updates: Partial<VoiceRecognitionState>) {
    const currentState = this.getState();
    const newState = { ...currentState, ...updates };
    this.onStateChangeCallback?.(newState);
  }

  public getState(): VoiceRecognitionState {
    return {
      isSupported: this.recognition !== null,
      isListening: this.isListening,
      isProcessing: false,
      interimTranscript: '',
      finalTranscript: '',
      error: null
    };
  }

  public startListening(): boolean {
    if (!this.recognition) {
      this.onErrorCallback?.('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.onErrorCallback?.('Failed to start speech recognition');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  public onStateChange(callback: (state: VoiceRecognitionState) => void): void {
    this.onStateChangeCallback = callback;
  }

  public onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  public cleanup(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Enhanced Gemini API integration for voice processing
export async function processVoiceWithGemini(audioBlob: Blob): Promise<string> {
  try {
    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: base64Audio,
            },
          },
          {
            text: 'Transcribe this audio to text. Return only the transcribed text without any additional formatting or commentary.',
          },
        ],
      },
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error processing voice with Gemini:", error);
    throw new Error("Failed to process voice input. Please try again.");
  }
}

// Utility function to convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Audio recording utility
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw new Error('Failed to start audio recording. Please check microphone permissions.');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.stream?.getTracks().forEach(track => track.stop());
    });
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
