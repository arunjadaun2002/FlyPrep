import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getRoom, joinRoom, updateParticipant } from '../services/api';
import { socketService } from '../services/socket';
import styles from './GroupDiscussion.module.css';

const TOPIC_TYPES = {
  technical: {
    name: "Technical",
    topics: [
      "Impact of AI on Future Jobs",
      "Cybersecurity Challenges",
      "Cloud Computing vs Edge Computing",
      "Future of 5G Technology",
      "Blockchain Applications"
    ]
  },
  hr: {
    name: "HR",
    topics: [
      "Remote Work Culture",
      "Employee Well-being",
      "Diversity in Workplace",
      "Future of Recruitment",
      "Work-Life Balance"
    ]
  },
  current_affairs: {
    name: "Current Affairs",
    topics: [
      "Digital Privacy Concerns",
      "Climate Change Impact",
      "Global Economic Trends",
      "Social Media Influence",
      "Education System Changes"
    ]
  },
  management: {
    name: "Management",
    topics: [
      "Leadership in Crisis",
      "Change Management",
      "Team Building Strategies",
      "Project Management Methods",
      "Innovation Management"
    ]
  }
};

const DISCUSSION_DURATIONS = [
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "20 minutes", value: 1200 }
];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const GroupDiscussion = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Name, 2: Join/Create, 3: Room Setup, 4: Preparation, 5: Discussion
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [selectedTopicType, setSelectedTopicType] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [stream, setStream] = useState(null);
  const [discussionTimer, setDiscussionTimer] = useState(300); // 5 minutes default
  const [prepTimer, setPrepTimer] = useState(30); // 30 seconds prep time
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showStartMessage, setShowStartMessage] = useState(false);
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);
  const [isWaitingForMembers, setIsWaitingForMembers] = useState(true);
  const [inviteTimer, setInviteTimer] = useState(300); // 5 minutes for invite expiry
  const [showInviteExpired, setShowInviteExpired] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [participantId, setParticipantId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [streamError, setStreamError] = useState(null);
  const [isStreamInitialized, setIsStreamInitialized] = useState(false);

  useEffect(() => {
    if (selectedTopicType) {
      const topics = TOPIC_TYPES[selectedTopicType].topics;
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      setSelectedTopic(randomTopic);
    }
  }, [selectedTopicType]);

  useEffect(() => {
    let interval;
    if (isPreparing && prepTimer > 0) {
      interval = setInterval(() => {
        setPrepTimer(prev => prev - 1);
      }, 1000);
    } else if (prepTimer === 0 && isPreparing) {
      setIsPreparing(false);
      setIsTimerRunning(true);
      setShowStartMessage(true);
      setTimeout(() => setShowStartMessage(false), 3000);
    }
    return () => clearInterval(interval);
  }, [isPreparing, prepTimer]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && discussionTimer > 0) {
      interval = setInterval(() => {
        setDiscussionTimer(prev => prev - 1);
      }, 1000);
    } else if (discussionTimer === 0) {
      setIsTimerRunning(false);
      // Handle discussion end
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, discussionTimer]);

  // Add invite timer effect
  useEffect(() => {
    let interval;
    if (isWaitingForMembers && inviteTimer > 0) {
      interval = setInterval(() => {
        setInviteTimer(prev => prev - 1);
      }, 1000);
    } else if (inviteTimer === 0) {
      setShowInviteExpired(true);
      // Handle invite expiry - could redirect or reset
    }
    return () => clearInterval(interval);
  }, [isWaitingForMembers, inviteTimer]);

  // Check if all members have joined
  useEffect(() => {
    if (step === 4) {
      setIsWaitingForMembers(participants.length < maxParticipants);
    }
  }, [participants.length, maxParticipants, step]);

  useEffect(() => {
    const handleConnectionStatus = (data) => {
      console.log('Connection status:', data);
      setConnectionStatus(data.status);
      // If we're connected to a room, update the room ID
      if (data.status === 'connected' && data.roomId) {
        setRoomId(data.roomId);
      }
    };

    const handleRoomState = (data) => {
      console.log('Received room state:', data);
      if (!data) return;
      
      setMaxParticipants(data.maxParticipants);
      setSelectedTopicType(data.topicType);
      setSelectedTopic(data.topic);
      setDiscussionTimer(data.duration);
      
      // Update participants list, ensuring no duplicates
      setParticipants(prevParticipants => {
        const newParticipants = data.participants.filter(p => 
          !prevParticipants.some(existing => existing.id === p.id)
        );
        return [...prevParticipants, ...newParticipants];
      });
      
      setIsWaitingForMembers(data.participants.length < data.maxParticipants);
    };

    const handleParticipantJoined = (data) => {
      console.log('Participant joined:', data);
      setParticipants(prev => {
        // Check if participant already exists
        const exists = prev.some(p => p.id === data.participant.id);
        if (!exists) {
          const newParticipants = [...prev, data.participant];
          setIsWaitingForMembers(newParticipants.length < maxParticipants);
          return newParticipants;
        }
        return prev;
      });
    };

    const handleParticipantLeft = (data) => {
      console.log('Participant left:', data);
      setParticipants(prev => {
        const newParticipants = prev.filter(p => p.id !== data.participantId);
        setIsWaitingForMembers(newParticipants.length < maxParticipants);
        return newParticipants;
      });
    };

    const handleDiscussionStart = () => {
      setIsPreparing(true);
      setIsWaitingForMembers(false);
    };

    socketService.on('connection', handleConnectionStatus);
    socketService.on('room_state', handleRoomState);
    socketService.on('participant_joined', handleParticipantJoined);
    socketService.on('participant_left', handleParticipantLeft);
    socketService.on('discussion_start', handleDiscussionStart);

    return () => {
      socketService.off('connection', handleConnectionStatus);
      socketService.off('room_state', handleRoomState);
      socketService.off('participant_joined', handleParticipantJoined);
      socketService.off('participant_left', handleParticipantLeft);
      socketService.off('discussion_start', handleDiscussionStart);
    };
  }, [maxParticipants]);

  // Effect to check if all participants have joined
  useEffect(() => {
    if (participants.length === maxParticipants) {
      if (isAdmin) {
        // Automatically start discussion after a short delay
        setTimeout(() => {
          socketService.send('start_discussion');
          setIsPreparing(true);
          setIsWaitingForMembers(false);
        }, 2000);
      }
    }
  }, [participants.length, maxParticipants, isAdmin]);

  // Improved stream initialization
  const initializeStream = async () => {
    try {
      console.log('Attempting to access media devices...');
      
      // First check if we already have a stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          aspectRatio: 16/9
        },
        audio: true
      });

      console.log('Media stream obtained successfully');
      const videoTrack = mediaStream.getVideoTracks()[0];
      console.log('Video track:', videoTrack?.label, 'enabled:', videoTrack?.enabled);
      
      if (!videoTrack) {
        throw new Error('No video track available');
      }

      // Set the stream to state
      setLocalStream(mediaStream);
      setStream(mediaStream);
      setIsStreamInitialized(true);
      setIsCameraOn(true);
      setIsMicOn(true);
      
      return mediaStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setStreamError(error.message);
      setError(`Camera access error: ${error.message}`);
      return null;
    }
  };

  // Effect to handle video stream mounting
  useEffect(() => {
    if (localStream && videoRef.current && isStreamInitialized) {
      console.log('Mounting video stream to element');
      videoRef.current.srcObject = localStream;
      
      const playVideo = async () => {
        try {
          await videoRef.current.play();
          console.log('Video playing in mount effect');
          setStreamError(null);
        } catch (err) {
          console.error('Error playing video in mount effect:', err);
          setStreamError('Failed to play video feed');
        }
      };

      videoRef.current.onloadedmetadata = () => {
        playVideo();
      };

      // Add error event listener
      videoRef.current.onerror = (e) => {
        console.error('Video element error in mount:', e);
        setStreamError('Error displaying video feed');
      };
    }
  }, [localStream, isStreamInitialized]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [localStream]);

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const handleJoinRoom = async () => {
    try {
      setError(null);
      if (inputRoomId.trim()) {
        const roomId = inputRoomId.trim().toUpperCase();
        console.log('Attempting to join room:', roomId);
        
        // Initialize stream first
        const stream = await initializeStream();
        if (!stream) {
          throw new Error('Failed to initialize camera and microphone');
        }
        
        // Get room details
        const roomDetails = await getRoom(roomId);
        console.log('Room details:', roomDetails);
        
        if (roomDetails.participants.length >= roomDetails.maxParticipants) {
          throw new Error('Room is full');
        }
        
        // Connect to WebSocket
        await socketService.connect(roomId);
        
        // Join room
        const joinResponse = await joinRoom(roomId, {
          name,
          isLocal: true,
          isReady: false
        });
        
        // Update state
        setRoomId(roomId);
        setParticipantId(joinResponse.participant.id);
        setSelectedTopic(roomDetails.topic);
        setSelectedTopicType(roomDetails.topicType);
        setMaxParticipants(roomDetails.maxParticipants);
        setDiscussionTimer(roomDetails.duration);
        
        // Update participant status
        await updateParticipant(roomId, joinResponse.participant.id, {
          isReady: true,
          hasStream: true
        });
        
        setStep(4);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message);
      socketService.disconnect();
    }
  };

  const handleCreateRoom = async () => {
    try {
      setError(null);
      setIsAdmin(true);
      setStep(3);
    } catch (err) {
      console.error('Error in handleCreateRoom:', err);
      setError(err.message || 'Failed to setup room');
    }
  };

  const handleStartDiscussion = async () => {
    try {
      setError(null);
      
      if (isAdmin) {
        // Initialize stream first
        const stream = await initializeStream();
        if (!stream) {
          throw new Error('Failed to initialize camera and microphone');
        }
        
        const createResponse = await createRoom({
          maxParticipants,
          topicType: selectedTopicType,
          topic: selectedTopic,
          duration: discussionTimer,
          name
        });
        
        const currentRoomId = createResponse.roomId;
        setParticipantId(createResponse.participant.id);
        setRoomId(currentRoomId);
        
        await socketService.connect(currentRoomId);
        
        await updateParticipant(currentRoomId, createResponse.participant.id, {
          name,
          isLocal: true,
          isReady: true,
          hasStream: true,
          isAdmin: true
        });

        // Add the local participant to the participants list
        setParticipants([{
          id: createResponse.participant.id,
          name,
          isLocal: true,
          isReady: true,
          hasStream: true,
          isAdmin: true
        }]);
        
        setStep(4);
      }
    } catch (err) {
      console.error('Error in handleStartDiscussion:', err);
      setError(err.message);
      socketService.disconnect();
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setStep(2);
    }
  };

  const copyRoomId = () => {
    // Copy only the room ID
    navigator.clipboard.writeText(roomId);
    setShowCopyIndicator(true);
    setTimeout(() => setShowCopyIndicator(false), 2000);
  };

  // Update getParticipantSlots to handle stream initialization
  const getParticipantSlots = () => {
    const slots = [];
    for (let i = 0; i < maxParticipants; i++) {
      const participant = participants[i];
      const isLocal = participant?.id === participantId;
      
      slots.push(
        <div 
          key={i} 
          className={`${styles.participantSlot} ${maxParticipants === 2 ? styles.twoParticipants : ''}`}
          style={{ gridArea: maxParticipants === 2 ? (i === 0 ? 'left' : 'right') : 
                           i === 0 ? 'left' : 
                           i === 1 ? 'right' : 
                           i === 2 ? 'top' : 'bottom' }}
        >
          <div className={styles.participantBox}>
            <div className={styles.videoContainer}>
              {isLocal ? (
                <>
                  <video
                    key="localVideo"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)',
                      backgroundColor: '#000',
                      display: 'block',
                      minHeight: '240px'
                    }}
                  />
                  {!isStreamInitialized && (
                    <div className={styles.streamInitializing}>
                      Initializing camera...
                    </div>
                  )}
                  {streamError && (
                    <div className={styles.streamError}>
                      {streamError}
                    </div>
                  )}
                  {!isCameraOn && (
                    <div className={styles.cameraOffOverlay}>
                      Camera is off
                    </div>
                  )}
                </>
              ) : participant ? (
                <div className={styles.mockVideo}>
                  <span>📹</span>
                </div>
              ) : (
                <div className={styles.emptySlot}>
                  <span>Waiting...</span>
                </div>
              )}
            </div>
            <div className={styles.participantName}>
              {isLocal ? name : participant?.name || "Waiting for participant..."}
            </div>
          </div>
        </div>
      );
    }
    return slots;
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div className={styles.setupCard}>
          <h1 className={styles.title}>Welcome to Group Discussion</h1>
          <form onSubmit={handleNameSubmit} className={styles.nameForm}>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.nameInput}
              required
            />
            <button type="submit" className={styles.submitButton}>
              Continue
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className={styles.setupCard}>
          <h1 className={styles.title}>Group Discussion</h1>
          <div className={styles.joinCreateSection}>
            <div className={styles.joinSection}>
              <h2>Join Room</h2>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className={styles.roomInput}
              />
              <button 
                className={styles.joinButton}
                onClick={handleJoinRoom}
                disabled={!inputRoomId.trim()}
              >
                Join Room
              </button>
            </div>
            <div className={styles.createSection}>
              <h2>Create Room</h2>
              <button 
                className={styles.createButton}
                onClick={handleCreateRoom}
              >
                Create New Room
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.setupCard}>
          <h1 className={styles.title}>Room Setup</h1>
          <div className={styles.setupForm}>
            <div className={styles.formGroup}>
              <label>Number of Participants</label>
              <div className={styles.participantSelector}>
                <button 
                  onClick={() => setMaxParticipants(prev => Math.max(2, prev - 1))}
                  disabled={maxParticipants <= 2}
                >
                  -
                </button>
                <span>{maxParticipants}</span>
                <button 
                  onClick={() => setMaxParticipants(prev => Math.min(6, prev + 1))}
                  disabled={maxParticipants >= 6}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Topic Type</label>
              <select 
                value={selectedTopicType} 
                onChange={(e) => setSelectedTopicType(e.target.value)}
                className={styles.topicTypeSelect}
                required
              >
                <option value="">Select Topic Type</option>
                {Object.entries(TOPIC_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </div>

            {selectedTopicType && (
              <div className={styles.formGroup}>
                <label>Selected Topic</label>
                <div className={styles.selectedTopic}>
                  {selectedTopic}
                </div>
                <button 
                  onClick={() => {
                    const topics = TOPIC_TYPES[selectedTopicType].topics;
                    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                    setSelectedTopic(randomTopic);
                  }}
                  className={styles.refreshButton}
                >
                  🔄 New Topic
                </button>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Discussion Duration</label>
              <select 
                value={discussionTimer} 
                onChange={(e) => setDiscussionTimer(Number(e.target.value))}
                className={styles.durationSelect}
                required
              >
                {DISCUSSION_DURATIONS.map(duration => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            <button 
              className={styles.startButton}
              onClick={handleStartDiscussion}
              disabled={!selectedTopicType}
            >
              Start Discussion
            </button>
          </div>
        </div>
      )}

      {(step === 4 || step === 5) && (
        <div className={styles.discussionRoom}>
          <div className={styles.roomHeader}>
            <div className={styles.roomInfo}>
              <h2>Welcome to Group Discussion</h2>
              <div className={styles.roomIdDisplay}>
                Room ID: <span className={styles.roomIdValue} onClick={copyRoomId}>{roomId}</span>
                {showCopyIndicator && <div className={styles.copyIndicator}>Room ID Copied!</div>}
              </div>
              {isWaitingForMembers ? (
                <div className={styles.inviteTimer}>
                  Invite expires in: {formatTime(inviteTimer)}
                </div>
              ) : isPreparing ? (
                <div className={styles.prepTimer}>
                  Preparation Time: {formatTime(prepTimer)}
                </div>
              ) : (
                <div className={styles.discussionTimer}>
                  Time Remaining: {formatTime(discussionTimer)}
                </div>
              )}
            </div>
          </div>

          <div className={styles.discussionLayout}>
            <div className={`${styles.participantsGrid} ${styles['participants' + maxParticipants]}`}>
              {getParticipantSlots()}
              
              {/* Center topic */}
              <div className={styles.topicCenter}>
                {selectedTopic}
              </div>
            </div>

            <div className={styles.controlsContainer}>
              <button 
                onClick={toggleCamera}
                className={`${styles.controlButton} ${isCameraOn ? styles.active : ''}`}
                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? '🎥' : '🚫'}
              </button>
              <button 
                onClick={toggleMic}
                className={`${styles.controlButton} ${isMicOn ? styles.active : ''}`}
                title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicOn ? '🎤' : '🔇'}
              </button>
            </div>
          </div>
        </div>
      )}

      {connectionStatus === 'disconnected' && (step === 4 || step === 5) && (
        <div className={styles.connectionMessage}>
          Reconnecting to room...
        </div>
      )}
    </div>
  );
};

export default GroupDiscussion; 