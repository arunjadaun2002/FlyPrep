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

  useEffect(() => {
    if (isAdmin) {
      setRoomId(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
  }, [isAdmin]);

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
      setConnectionStatus(data.status);
    };

    const handleParticipantJoined = (data) => {
      setParticipants(prev => [...prev, data.participant]);
    };

    const handleParticipantLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
    };

    const handleDiscussionStart = () => {
      setIsPreparing(true);
      setIsWaitingForMembers(false);
    };

    socketService.on('connection', handleConnectionStatus);
    socketService.on('participant_joined', handleParticipantJoined);
    socketService.on('participant_left', handleParticipantLeft);
    socketService.on('discussion_start', handleDiscussionStart);

    return () => {
      socketService.off('connection', handleConnectionStatus);
      socketService.off('participant_joined', handleParticipantJoined);
      socketService.off('participant_left', handleParticipantLeft);
      socketService.off('discussion_start', handleDiscussionStart);
      socketService.disconnect();
    };
  }, []);

  const initializeStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(!isMicOn);
    }
  };

  const handleJoinRoom = async () => {
    try {
      setError(null);
      if (inputRoomId.trim()) {
        const roomDetails = await getRoom(inputRoomId.trim().toUpperCase());
        if (roomDetails.participants.length >= roomDetails.maxParticipants) {
          throw new Error('Room is full');
        }
        
        await joinRoom(inputRoomId.trim().toUpperCase(), {
          name,
          isLocal: true
        });

        setRoomId(inputRoomId.trim().toUpperCase());
        setMaxParticipants(roomDetails.maxParticipants);
        setSelectedTopicType(roomDetails.topicType);
        setSelectedTopic(roomDetails.topic);
        setDiscussionTimer(roomDetails.duration);
        setParticipants(roomDetails.participants);
        
        socketService.connect(inputRoomId.trim().toUpperCase());
        await initializeStream();
        setStep(4);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setError(null);
      const response = await createRoom({
        maxParticipants,
        topicType: selectedTopicType,
        topic: selectedTopic,
        duration: discussionTimer
      });
      setRoomId(response.roomId);
      setIsAdmin(true);
      socketService.connect(response.roomId);
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartDiscussion = async () => {
    try {
      setError(null);
      await initializeStream();
      const response = await updateParticipant(roomId, Date.now(), {
        name,
        isLocal: true,
        isReady: true
      });
      
      if (response.allReady) {
        socketService.send('start_discussion', { roomId });
        setIsPreparing(true);
        setIsWaitingForMembers(false);
      }
      setStep(4);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setStep(2);
    }
  };

  // Mock participants for demo
  useEffect(() => {
    if (step === 4) {
      const mockParticipants = Array.from({ length: maxParticipants - 1 }, (_, i) => ({
        id: i + 1,
        name: `Person ${i + 2}`,
        isLocal: false
      }));
      setParticipants(prev => [...prev, ...mockParticipants]);
    }
  }, [step, maxParticipants]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setShowCopyIndicator(true);
    setTimeout(() => setShowCopyIndicator(false), 2000);
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
          <div className={styles.roomInfo}>
            <div className={styles.roomDetails}>
              {isAdmin && <p className={styles.adminBadge}>Admin</p>}
            </div>
            <div className={styles.timer}>
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

          <div className={styles.roomSideDisplay}>
            <span className={styles.roomIdLabel}>Room ID</span>
            <div className={styles.roomIdValue} onClick={copyRoomId} title="Click to copy">
              {roomId}
            </div>
            <span className={`${styles.copyIndicator} ${showCopyIndicator ? styles.visible : ''}`}>
              Copied!
            </span>
            {isWaitingForMembers && (
              <div className={styles.inviteInfo}>
                <p>Waiting for {maxParticipants - participants.length} more members</p>
                <div className={styles.shareOptions}>
                  <button 
                    className={styles.shareButton} 
                    onClick={() => {
                      const shareText = `Join my Group Discussion!\nRoom ID: ${roomId}\nExpires in: ${formatTime(inviteTimer)}`;
                      navigator.clipboard.writeText(shareText);
                      setShowCopyIndicator(true);
                      setTimeout(() => setShowCopyIndicator(false), 2000);
                    }}
                  >
                    Share Invite
                  </button>
                </div>
              </div>
            )}
          </div>

          {showInviteExpired && (
            <div className={styles.expiredMessage}>
              Invite has expired! Please create a new room.
            </div>
          )}

          {isWaitingForMembers && (
            <div className={styles.waitingMessage}>
              Waiting for all members to join...
              <p className={styles.waitingCount}>
                {participants.length} of {maxParticipants} members present
              </p>
            </div>
          )}

          {showStartMessage && !isWaitingForMembers && (
            <div className={styles.startMessage}>
              Group Discussion Started!
            </div>
          )}

          <div className={styles.discussionLayout}>
            <div className={styles.topic}>
              <h3>{selectedTopic}</h3>
            </div>

            <div className={styles.participantsCircle}>
              {participants.map((participant, index) => {
                const angle = (360 / participants.length) * index;
                const style = {
                  transform: `rotate(${angle}deg) translate(${300}px) rotate(-${angle}deg)`
                };

                return (
                  <div 
                    key={participant.id}
                    className={styles.participantContainer}
                    style={style}
                  >
                    {participant.isLocal ? (
                      <div className={styles.videoWrapper}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted={true}
                          className={styles.video}
                        />
                        <div className={styles.participantName}>{name}</div>
                        <div className={styles.videoControls}>
                          <button 
                            onClick={toggleCamera}
                            className={`${styles.controlButton} ${isCameraOn ? styles.active : ''}`}
                          >
                            {isCameraOn ? '🎥' : '🚫'}
                          </button>
                          <button 
                            onClick={toggleMic}
                            className={`${styles.controlButton} ${isMicOn ? styles.active : ''}`}
                          >
                            {isMicOn ? '🎤' : '🔇'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.videoWrapper}>
                        <div className={styles.mockVideo}>
                          <span>📹</span>
                        </div>
                        <div className={styles.participantName}>{participant.name}</div>
                      </div>
                    )}
                  </div>
                );
              })}
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