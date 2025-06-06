
import React, { useRef } from 'react';
import { LoaderCircle, Plus, Mic, ChevronDown, Paperclip, XCircle, AudioWaveform } from 'lucide-react'; // Icons
import { AnimatedSendButton } from './AnimatedSendButton'; // Import the new button

interface MessageInputProps {
  inputValue: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isRecording: boolean;
  onMicClick: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  filePreview: string | null;
  recordedAudioBlob: Blob | null;
  clearAttachments: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  isRecording,
  onMicClick,
  onFileChange,
  selectedFile,
  filePreview,
  recordedAudioBlob,
  clearAttachments,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isLoading && (inputValue.trim() !== '' || selectedFile || recordedAudioBlob)) {
      event.preventDefault(); 
      onSendMessage();
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const attachmentPresent = selectedFile || recordedAudioBlob;

  return (
    <div className="bg-brand-bg-dark p-3 sm:p-4 border-t border-brand-border mt-auto sticky bottom-0">
      <div className="bg-brand-surface-dark rounded-xl shadow-md flex flex-col">
        {attachmentPresent && (
          <div className="p-2 border-b border-brand-border/30 flex items-center justify-between text-xs">
            {selectedFile && (
              <div className="flex items-center space-x-2 overflow-hidden">
                {filePreview && selectedFile.type.startsWith('image/') ? (
                  <img src={filePreview} alt="Preview" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <Paperclip size={16} className="text-brand-secondary flex-shrink-0" />
                )}
                <span className="text-brand-text-secondary truncate" title={selectedFile.name}>{selectedFile.name}</span>
              </div>
            )}
            {recordedAudioBlob && !selectedFile && ( // Show audio only if no file selected, or design for both
                 <div className="flex items-center space-x-2">
                    <AudioWaveform size={16} className="text-brand-secondary" />
                    <span className="text-brand-text-secondary">Audio recording ready</span>
                 </div>
            )}
            <button onClick={clearAttachments} className="p-1 text-brand-text-secondary hover:text-brand-error rounded-full active:scale-90 transition-transform" aria-label="Clear attachment">
              <XCircle size={16} />
            </button>
          </div>
        )}
        <textarea
          value={inputValue}
          onChange={onInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "GUEST AI is thinking..." : (isRecording ? "Recording audio..." : "Message GUEST AI...")}
          className="w-full p-3 bg-transparent text-brand-text-primary focus:outline-none placeholder-brand-text-input-placeholder text-sm resize-none"
          rows={attachmentPresent ? 2 : 3} // Reduce rows if attachment preview is shown
          disabled={isLoading}
          aria-label="Message GUEST AI"
        />
        <div className="flex items-center justify-between p-2 border-t border-brand-border/50">
          <div className="flex items-center space-x-1">
            <button
                onClick={handlePlusClick}
                className="p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface-light focus:outline-none transition-colors active:scale-95 active:bg-brand-surface-light/80"
                aria-label="Attach file"
                disabled={isLoading || isRecording}
              >
                <Plus size={20} />
            </button>
            <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/png, image/jpeg, image/webp, image/gif, text/plain" />
            
            <button
              onClick={onMicClick}
              className={`p-2 text-brand-text-secondary hover:text-brand-primary rounded-full hover:bg-brand-surface-light focus:outline-none transition-colors active:scale-95 active:bg-brand-surface-light/80 ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              disabled={isLoading}
            >
              <Mic size={20} />
            </button>
             <button
              className="flex items-center space-x-1 text-xs text-brand-text-secondary hover:text-brand-primary focus:outline-none px-2 py-1 rounded-md hover:bg-brand-surface-light transition-colors active:scale-95 active:bg-brand-surface-light/80"
              aria-label="Quick responses"
              disabled={isLoading || isRecording}
            >
              <span>Quick response</span>
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex items-center space-x-1">
            {isLoading ? (
                <div className="p-2.5 flex items-center justify-center" style={{width: '40px', height: '40px'}}> {/* Match size of AnimatedSendButton */}
                    <LoaderCircle size={20} className="animate-spin text-brand-primary" />
                </div>
            ) : (
                <AnimatedSendButton
                    onClick={onSendMessage}
                    disabled={(!inputValue.trim() && !selectedFile && !recordedAudioBlob)}
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};