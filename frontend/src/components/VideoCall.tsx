'use client';

import { useState, useEffect } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash } from 'react-icons/fa';
import { videoAPI } from '@/lib/api';

interface VideoCallProps {
    appointmentId: string;
    onCallEnd: () => void;
}

export default function VideoCall({ appointmentId, onCallEnd }: VideoCallProps) {
    const [client, setClient] = useState<IAgoraRTCClient | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            initializeCall();
        }, 100);

        return () => {
            clearTimeout(timer);
            leaveCall(false); // Don't call API on cleanup
        };
    }, []);

    const initializeCall = async () => {
        try {
            // Get Agora token from backend
            const response = await videoAPI.getToken(appointmentId);
            const { token, channelName, appId } = response.data;

            // Create Agora client
            const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            setClient(agoraClient);

            // Join channel
            await agoraClient.join(appId, channelName, token, null);

            // Create local tracks
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);

            // Wait for DOM element to exist before playing
            const localPlayer = document.getElementById('local-player');
            if (localPlayer) {
                videoTrack.play(localPlayer);
            } else {
                console.warn('local-player element not found, playing in body');
                videoTrack.play('local-player');
            }

            // Publish tracks
            await agoraClient.publish([audioTrack, videoTrack]);

            setIsJoined(true);

            // Handle remote users
            agoraClient.on('user-published', async (user, mediaType) => {
                await agoraClient.subscribe(user, mediaType);

                if (mediaType === 'video') {
                    const remoteVideoTrack = user.videoTrack;
                    const remotePlayer = document.getElementById('remote-player');
                    if (remotePlayer && remoteVideoTrack) {
                        // Clear the placeholder content
                        remotePlayer.innerHTML = '';
                        remoteVideoTrack.play(remotePlayer);
                    }
                }

                if (mediaType === 'audio') {
                    const remoteAudioTrack = user.audioTrack;
                    remoteAudioTrack?.play();
                }
            });

            agoraClient.on('user-unpublished', (user) => {
                console.log('User unpublished:', user.uid);
            });

        } catch (err: any) {
            console.error('Error initializing call:', err);
            if (err.code === 'PERMISSION_DENIED') {
                setError('Media access denied. Please allow camera and microphone access in your browser settings.');
            } else if (err.code === 'NOT_READABLE') {
                setError('Camera or microphone is already in use by another application.');
            } else {
                setError(err.message || 'Failed to join call. Please check your connection and try again.');
            }
        }
    };

    const toggleAudio = () => {
        if (localAudioTrack) {
            localAudioTrack.setEnabled(isAudioMuted);
            setIsAudioMuted(!isAudioMuted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrack) {
            localVideoTrack.setEnabled(isVideoMuted);
            setIsVideoMuted(!isVideoMuted);
        }
    };

    const leaveCall = async (callApi: boolean = true) => {
        try {
            // Close local tracks
            localAudioTrack?.close();
            localVideoTrack?.close();

            // Leave channel
            if (client) {
                await client.leave();
            }

            // Only notify backend and navigate if explicitly called (not on cleanup)
            if (callApi) {
                await videoAPI.endCall(appointmentId);
                onCallEnd();
            }
        } catch (err) {
            console.error('Error leaving call:', err);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center text-white">
                    <p className="text-xl mb-4">Error: {error}</p>
                    <button onClick={onCallEnd} className="btn btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50">
            {/* Video Container */}
            <div className="relative h-full">
                {/* Remote Video (Full Screen) */}
                <div id="remote-player" className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="text-6xl mb-4">👤</div>
                        <p>Waiting for other participant...</p>
                    </div>
                </div>

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute top-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
                    <div id="local-player" className="w-full h-full"></div>
                    {isVideoMuted && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <div className="text-white text-center">
                                <div className="text-4xl mb-2">👤</div>
                                <p className="text-sm">Camera Off</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                    {/* Mute Audio */}
                    <button
                        onClick={toggleAudio}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isAudioMuted
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
                            }`}
                    >
                        {isAudioMuted ? (
                            <FaMicrophoneSlash className="text-2xl text-white" />
                        ) : (
                            <FaMicrophone className="text-2xl text-white" />
                        )}
                    </button>

                    {/* End Call */}
                    <button
                        onClick={() => leaveCall(true)}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-all"
                    >
                        <FaPhoneSlash className="text-2xl text-white" />
                    </button>

                    {/* Mute Video */}
                    <button
                        onClick={toggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoMuted
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
                            }`}
                    >
                        {isVideoMuted ? (
                            <FaVideoSlash className="text-2xl text-white" />
                        ) : (
                            <FaVideo className="text-2xl text-white" />
                        )}
                    </button>
                </div>

                {/* Call Status */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg">
                    <p className="text-white text-sm">
                        {isJoined ? '🟢 Connected' : '🟡 Connecting...'}
                    </p>
                </div>
            </div>
        </div>
    );
}
