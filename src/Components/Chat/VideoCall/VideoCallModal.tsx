import React, { useRef, useEffect, useState } from 'react';
import { IoClose, IoMic, IoMicOff, IoVideocam, IoVideocamOff, IoCall } from 'react-icons/io5';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'voice' | 'video';
  isIncoming?: boolean;
  callerName?: string;
  onAccept?: () => void;
  onReject?: () => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  callType,
  isIncoming = false,
  callerName,
  onAccept,
  onReject
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStartTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCallStartTime(new Date());
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setCallStartTime(null);
    setCallDuration(0);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleAccept = () => {
    startLocalStream();
    onAccept?.();
  };

  const handleReject = () => {
    stopLocalStream();
    onReject?.();
  };

  const handleEndCall = () => {
    stopLocalStream();
    onClose();
  };

  useEffect(() => {
    if (isOpen && !isIncoming) {
      startLocalStream();
    }
    return () => {
      if (!isOpen) {
        stopLocalStream();
      }
    };
  }, [isOpen, isIncoming]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {isIncoming ? `مكالمة واردة من ${callerName}` : 'مكالمة جارية'}
            </h3>
            {callStartTime && (
              <p className="text-sm text-gray-300">{formatDuration(callDuration)}</p>
            )}
          </div>
          <button
            onClick={handleEndCall}
            className="text-gray-300 hover:text-white"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative bg-gray-900 h-96">
          {callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture in Picture) */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            /* Audio Call UI */
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <IoCall size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {isIncoming ? callerName : 'مكالمة صوتية'}
                </h3>
                {callStartTime && (
                  <p className="text-gray-300">{formatDuration(callDuration)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-100 p-4">
          {isIncoming ? (
            /* Incoming Call Controls */
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReject}
                className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors"
              >
                <IoClose size={24} />
              </button>
              <button
                onClick={handleAccept}
                className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 transition-colors"
              >
                <IoCall size={24} />
              </button>
            </div>
          ) : (
            /* Active Call Controls */
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {isMuted ? <IoMicOff size={20} /> : <IoMic size={20} />}
              </button>
              
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoOff 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {isVideoOff ? <IoVideocamOff size={20} /> : <IoVideocam size={20} />}
                </button>
              )}
              
              <button
                onClick={handleEndCall}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
              >
                <IoClose size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;