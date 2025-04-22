import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import nodemailer from 'nodemailer';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store WebSocket connections
const connections = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const roomId = req.url.split('/').pop();
  console.log(`Client connected to room: ${roomId}`);

  // Store the connection
  if (!connections.has(roomId)) {
    connections.set(roomId, new Set());
  }
  connections.get(roomId).add(ws);

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const room = rooms.get(roomId);

      if (!room) {
        ws.send(JSON.stringify({ type: 'error', payload: 'Room not found' }));
        return;
      }

      // Broadcast to all clients in the room
      connections.get(roomId).forEach((client) => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`Client disconnected from room: ${roomId}`);
    if (connections.has(roomId)) {
      connections.get(roomId).delete(ws);
      if (connections.get(roomId).size === 0) {
        connections.delete(roomId);
      }
    }
  });
});

// CORS configuration
const corsOptions = {
  origin: ['https://flyprep-frontend.onrender.com', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add CSP headers with more permissive settings
app.use((req, res, next) => {
  // Remove any existing CSP headers
  res.removeHeader('Content-Security-Policy');
  
  // Set a more permissive CSP
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval'; " +
    "style-src * 'unsafe-inline'; " +
    "font-src * data:; " +
    "img-src * data: blob:; " +
    "connect-src * ws: wss:;"
  );
  
  // Also set Cross-Origin-Embedder-Policy to allow loading resources
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Set Cross-Origin-Resource-Policy to allow loading resources
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  next();
});

// In-memory storage for rooms (replace with a database in production)
const rooms = new Map();

// Room routes
app.post('/api/rooms/create', (req, res) => {
  try {
    console.log('Received room creation request:', req.body);
    const { maxParticipants, topicType, topic, duration, name } = req.body;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const participant = {
      id: Date.now(),
      name: name || 'Room Creator',
      isLocal: true,
      joinedAt: new Date()
    };
    
    const room = {
      id: roomId,
      maxParticipants,
      topicType,
      topic,
      duration,
      participants: [participant],
      createdAt: new Date(),
    };
    
    rooms.set(roomId, room);
    res.json({ roomId, participant });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ message: 'Failed to get room details' });
  }
});

app.post('/api/rooms/join/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, isLocal } = req.body;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ message: 'Room is full' });
    }

    const participant = {
      id: Date.now(),
      name,
      isLocal,
      joinedAt: new Date()
    };

    room.participants.push(participant);
    rooms.set(roomId, room);

    res.status(200).json({ 
      participant,
      message: 'Joined room successfully' 
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Failed to join room' });
  }
});

// Add participant update endpoint
app.put('/api/rooms/participant/:roomId/:participantId', (req, res) => {
  try {
    const { roomId, participantId } = req.params;
    const updateData = req.body;
    
    console.log('Updating participant:', { roomId, participantId, updateData });
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const participantIndex = room.participants.findIndex(p => p.id === parseInt(participantId));
    if (participantIndex === -1) {
      console.log('Participant not found:', participantId);
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    // Update participant data
    room.participants[participantIndex] = {
      ...room.participants[participantIndex],
      ...updateData
    };
    
    // Broadcast the update to all connected clients
    const roomConnections = connections.get(roomId);
    if (roomConnections) {
      roomConnections.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'participant_updated',
            payload: {
              participantId: parseInt(participantId),
              participant: room.participants[participantIndex]
            }
          }));
        }
      });
    }
    
    console.log('Participant updated successfully');
    res.json({ success: true, participant: room.participants[participantIndex] });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ message: 'Failed to update participant' });
  }
});

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test route to verify CORS
app.options('*', cors(corsOptions));

app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working' });
});

// Route to handle bug reports
app.post('/api/report-bug', async (req, res) => {
  const { title, description } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'techengfly@gmail.com',
      subject: `Bug Report: ${title}`,
      text: `Bug Title: ${title}\n\nDescription:\n${description}`,
      html: `
        <h2>Bug Report</h2>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Bug report sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send bug report' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 