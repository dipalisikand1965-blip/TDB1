import React, { useState, useRef } from 'react';
import { Mic, MicOff, Upload, Send, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

const API = process.env.REACT_APP_BACKEND_URL;

export default function VoiceOrder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [petName, setPetName] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
      setResult(null);
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.');
      console.error('Microphone error:', err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/mp4'];
      if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
        setError('Please upload an audio file (mp3, wav, m4a, webm)');
        return;
      }
      
      // Validate file size (25MB max)
      if (file.size > 25 * 1024 * 1024) {
        setError('File too large. Maximum 25MB.');
        return;
      }
      
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setError('');
      setResult(null);
    }
  };

  // Submit voice order
  const submitVoiceOrder = async () => {
    if (!audioBlob) {
      setError('Please record or upload an audio message first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Check audio size (max 10MB to avoid Cloudflare limits)
      if (audioBlob.size > 10 * 1024 * 1024) {
        setError('Audio file too large. Please record a shorter message (max 10MB).');
        setUploading(false);
        return;
      }
      
      const formData = new FormData();
      // Determine file extension from blob type
      const fileExt = audioBlob.type?.includes('webm') ? 'webm' : 
                      audioBlob.type?.includes('mp4') ? 'mp4' :
                      audioBlob.type?.includes('wav') ? 'wav' : 'webm';
      formData.append('audio', audioBlob, `voice_order.${fileExt}`);
      if (customerName) formData.append('customer_name', customerName);
      if (customerEmail) formData.append('customer_email', customerEmail);
      if (customerPhone) formData.append('customer_phone', customerPhone);
      if (petName) formData.append('pet_name', petName);

      const response = await fetch(`${API}/api/channels/voice/order`, {
        method: 'POST',
        body: formData
      });

      // Handle non-JSON responses (like Cloudflare errors)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        if (text.includes('cloudflare') || text.includes('Cloudflare')) {
          setError('Request blocked by security. Please try uploading a smaller audio file.');
        } else {
          setError('Server error. Please try again.');
        }
        setUploading(false);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // Clear audio after successful submission
        setAudioBlob(null);
        setAudioUrl(null);
      } else {
        setError(data.detail || 'Failed to process voice order');
      }
    } catch (err) {
      console.error('Submit error:', err);
      // More specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Connection failed. Please check your internet and try again.');
      } else if (err.name === 'AbortError') {
        setError('Request timed out. Please try a shorter recording.');
      } else {
        setError(`Error: ${err.message || 'Network error. Please try again.'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  // Clear recording
  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Order</h1>
          <p className="text-gray-600 mt-2">Tell us what you'd like to order for your furry friend!</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-600" />
              Record Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  data-testid="voice-customer-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet's Name</label>
                <Input
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Your pet's name"
                  data-testid="voice-pet-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="voice-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  data-testid="voice-phone"
                />
              </div>
            </div>

            {/* Recording Section */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              {!audioUrl ? (
                <>
                  <p className="text-gray-600 mb-4">
                    {isRecording 
                      ? '🎙️ Recording... Speak your order clearly' 
                      : 'Press the microphone button and tell us your order'}
                  </p>
                  
                  {/* Record Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all transform hover:scale-105 ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                    }`}
                    data-testid="voice-record-btn"
                  >
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-white" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    {isRecording ? 'Click to stop recording' : 'Or upload an audio file'}
                  </p>
                  
                  {/* File Upload */}
                  {!isRecording && (
                    <div className="mt-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="voice-upload-btn"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Audio File
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">✅ Audio ready! Review and submit.</p>
                  
                  {/* Audio Player */}
                  <audio 
                    controls 
                    src={audioUrl} 
                    className="w-full mb-4"
                    data-testid="voice-audio-player"
                  />
                  
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={clearRecording}
                      data-testid="voice-clear-btn"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      onClick={submitVoiceOrder}
                      disabled={uploading}
                      className="bg-gradient-to-r from-pink-500 to-purple-600"
                      data-testid="voice-submit-btn"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Order
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" data-testid="voice-error">
                {error}
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6" data-testid="voice-result">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-green-800">Order Received!</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-500">Request ID</p>
                    <p className="font-mono font-bold text-lg">{result.request_id}</p>
                  </div>
                  
                  {result.extracted_data?.items?.length > 0 && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-gray-500 mb-2">Items Detected</p>
                      {result.extracted_data.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="text-gray-500">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {result.next_steps?.length > 0 && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-gray-500 mb-2">Next Steps</p>
                      <ul className="text-sm space-y-1">
                        {result.next_steps.map((step, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">💡 Tips for best results:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Speak clearly and mention the product name</li>
                <li>• Include quantity (e.g., "two birthday cakes")</li>
                <li>• Mention your pet's name for personalization</li>
                <li>• Specify delivery or pickup preference</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Example */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Example: "Hi, I'd like to order a birthday cake for my dog Bruno. He's turning 3 and loves banana flavor. Please deliver to Mumbai."</p>
        </div>
      </div>
    </div>
  );
}
