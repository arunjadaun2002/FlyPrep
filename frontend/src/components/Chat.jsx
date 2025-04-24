import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';
import styles from './Chat.module.css';

const Chat = ({ roomId, participantId, name, isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for incoming chat messages
    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    socketService.on('chat_message', handleChatMessage);

    return () => {
      socketService.off('chat_message', handleChatMessage);
    };
  }, []);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: generateUniqueId(),
        senderId: participantId,
        senderName: name,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString(),
        isAdmin: isAdmin
      };
      
      // Send message through socket
      socketService.send('chat_message', message);
      
      // Add message to local state
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>Group Chat</h3>
      </div>
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${
              message.senderId === participantId ? styles.sent : styles.received
            }`}
          >
            <div className={styles.messageHeader}>
              <span className={styles.senderName}>
                {message.senderName}
                {message.isAdmin && <span className={styles.adminBadge}>Admin</span>}
              </span>
              <span className={styles.timestamp}>{message.timestamp}</span>
            </div>
            <div className={styles.messageText}>{message.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className={styles.messageInput}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat; 