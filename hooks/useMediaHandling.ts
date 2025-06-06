
import { useState, useRef, useCallback } from 'react';
import type { Part } from "@google/genai";

export const useMediaHandling = () => {
  const [isMediaRecording, setIsMediaRecording] = useState(false); // Renamed to avoid clash with STT's isRecognizing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const startMediaRecording = async () => {
    setMediaError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setRecordedAudioBlob(audioBlob);
          stream.getTracks().forEach(track => track.stop()); // Stop stream tracks when recording stops
        };

        mediaRecorderRef.current.start();
        setIsMediaRecording(true);
        setRecordedAudioBlob(null); 
      } catch (err) {
        console.error("Error accessing microphone for MediaRecorder:", err);
        setMediaError("Microphone access denied or unavailable for audio recording.");
      }
    } else {
      setMediaError("Audio blob recording not supported by this browser.");
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && isMediaRecording) {
      mediaRecorderRef.current.stop();
      // mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); // Already in onstop
      setIsMediaRecording(false);
    }
  };

  // This handler is for explicit MediaRecorder, not STT
  const handleRecordAudioBlobClick = () => {
    if (isMediaRecording) {
      stopMediaRecording();
    } else {
      startMediaRecording();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMediaError("File is too large. Max 5MB.");
        setSelectedFile(null);
        setFilePreview(null);
        if (event.target) event.target.value = ''; 
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null); 
      }
    }
  };
  
  const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        mimeType: file.type,
        data: base64String,
      },
    };
  };
  
  const blobToGenerativePart = async (blob: Blob, mimeType: string): Promise<Part> => {
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(blob);
    });
    return {
      inlineData: {
        mimeType: mimeType,
        data: base64String,
      },
    };
  };

  const getGenerativePartsForMedia = useCallback(async (): Promise<Part[]> => {
    const parts: Part[] = [];
    if (selectedFile) {
        if (selectedFile.type.startsWith("text/")) {
            const textContent = await selectedFile.text();
            parts.push({ text: `\n\n--- Attached File: ${selectedFile.name} ---\n${textContent}\n--- End of File ---` });
        } else {
            parts.push(await fileToGenerativePart(selectedFile));
        }
    }
    // If recordedAudioBlob is still relevant (e.g. for sending explicit audio recordings not via STT)
    if (recordedAudioBlob) {
      parts.push(await blobToGenerativePart(recordedAudioBlob, recordedAudioBlob.type || 'audio/webm'));
    }
    return parts;
  }, [selectedFile, recordedAudioBlob]);


  const clearMediaAttachments = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setRecordedAudioBlob(null); // Clear recorded audio blob if any
  }, []);

  const resetMediaState = useCallback(() => {
    setIsMediaRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        // Ensure all tracks are stopped from the stream associated with MediaRecorder
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    }
    audioChunksRef.current = [];
    setRecordedAudioBlob(null);
    setSelectedFile(null);
    setFilePreview(null);
    setMediaError(null);
  }, []);


  return {
    isRecording: isMediaRecording, // For MediaRecorder
    recordedAudioBlob,
    selectedFile,
    filePreview,
    mediaError,
    setMediaError, 
    handleMicClick: handleRecordAudioBlobClick, // For MediaRecorder
    handleFileChange,
    getGenerativePartsForMedia,
    clearMediaAttachments,
    resetMediaState,
  };
};
