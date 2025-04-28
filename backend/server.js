import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import nodemailer from 'nodemailer';
import { WebSocketServer } from 'ws';
import interviewRoutes from './routes/interview.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store WebSocket connections and rooms
const connections = new Map();
const rooms = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const roomId = req.url.split('/').pop().toUpperCase();
  console.log(`Client connected to room: ${roomId}`);

  // Store the connection
  if (!connections.has(roomId)) {
    connections.set(roomId, new Set());
  }
  connections.get(roomId).add(ws);

  // Send current room state to the newly connected client
  const room = rooms.get(roomId);
  if (room) {
    console.log(`Sending room state to new client for room ${roomId}:`, room);
    ws.send(JSON.stringify({
      type: 'room_state',
      payload: room
    }));
  } else {
    console.log(`Room ${roomId} not found when client connected`);
  }

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const room = rooms.get(roomId);

      if (!room) {
        console.log(`Room ${roomId} not found when processing message`);
        ws.send(JSON.stringify({ type: 'error', payload: 'Room not found' }));
        return;
      }

      // Broadcast to all clients in the room
      connections.get(roomId).forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(data));
        }
      });

      // If this is a room state update, update the room in memory
      if (data.type === 'room_state') {
        console.log(`Updating room state for room ${roomId}`);
        rooms.set(roomId, data.payload);
      }
    } catch (error) {
      console.error(`Error handling message for room ${roomId}:`, error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`Client disconnected from room: ${roomId}`);
    if (connections.has(roomId)) {
      connections.get(roomId).delete(ws);
      
      // If this was the last connection and room exists, clean up the room
      if (connections.get(roomId).size === 0) {
        console.log(`Cleaning up empty room: ${roomId}`);
        rooms.delete(roomId);
        connections.delete(roomId);
      }
    }
  });
});

// CORS configuration
const corsOptions = {
  origin: ['https://flyprep-frontend.onrender.com', 'http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Ensure NODE_ENV is set to development for local testing
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('NODE_ENV set to development');
}

// Remove CSP headers for local development - this must run early in the middleware chain
app.use((req, res, next) => {
  // Remove all CSP-related headers
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('Referrer-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  
  // Add a header to indicate CSP is disabled
  res.setHeader('X-CSP-Disabled', 'true');
  
  next();
});

// Handle CSP headers (only used in production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // If DISABLE_CSP is set to true, don't set any CSP headers
    if (process.env.DISABLE_CSP === 'true') {
      console.log('CSP is disabled');
      return next();
    }
    
    // Set CSP header from environment variable or use a default
    const cspHeader = process.env.CSP_HEADER || 
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src * 'unsafe-inline' 'unsafe-eval'; " +
      "style-src * 'unsafe-inline'; " +
      "font-src * data:; " +
      "img-src * data: blob:; " +
      "connect-src * ws: wss:;";
    
    res.setHeader('Content-Security-Policy', cspHeader);
    
    // Also set Cross-Origin-Embedder-Policy to allow loading resources
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Set Cross-Origin-Resource-Policy to allow loading resources
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    next();
  });
}

// Room routes
app.post('/api/rooms/create', (req, res) => {
  try {
    console.log('Received room creation request:', req.body);
    const { maxParticipants, topicType, topic, duration, name } = req.body;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`Generated room ID: ${roomId}`);
    
    // Create the first participant (room creator)
    const participantId = Date.now();
    const participant = {
      id: participantId,
      name: name || 'Room Creator',
      isLocal: true,
      isAdmin: true,
      isReady: false,
      hasStream: false,
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
      status: 'waiting'
    };
    
    rooms.set(roomId, room);
    console.log(`Room created successfully: ${roomId}`, room);

    // Broadcast room creation to all connected clients
    if (connections.has(roomId)) {
      connections.get(roomId).forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'room_state',
            payload: room
          }));
        }
      });
    }

    res.json({ roomId, participant });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  try {
    const roomId = req.params.roomId.toUpperCase();
    console.log(`Getting room details for room: ${roomId}`);
    
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return res.status(404).json({ message: 'Room not found' });
    }

    console.log(`Room details for ${roomId}:`, room);
    res.json(room);
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ message: 'Failed to get room details' });
  }
});

app.post('/api/rooms/join/:roomId', (req, res) => {
  try {
    const roomId = req.params.roomId.toUpperCase();
    const { name, isLocal } = req.body;
    console.log(`Joining room ${roomId} with name ${name}`);
    
    const room = rooms.get(roomId);

    if (!room) {
      console.log(`Room ${roomId} not found when trying to join`);
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.participants.length >= room.maxParticipants) {
      console.log(`Room ${roomId} is full`);
      return res.status(400).json({ message: 'Room is full' });
    }

    const participant = {
      id: Date.now(),
      name,
      isLocal,
      isReady: false,
      hasStream: false,
      joinedAt: new Date()
    };

    // Add participant to room
    room.participants.push(participant);
    rooms.set(roomId, room);
    console.log(`Participant ${participant.id} added to room ${roomId}`);

    // Broadcast updated room state to all clients
    const roomConnections = connections.get(roomId);
    if (roomConnections) {
      roomConnections.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'room_state',
            payload: room
          }));
        }
      });
    }

    console.log(`Participant joined successfully: ${roomId}`, participant);
    res.status(200).json({ 
      participant,
      room, // Send full room state
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
    const roomId = req.params.roomId.toUpperCase();
    const { participantId } = req.params;
    const updateData = req.body;
    
    console.log('Updating participant:', { roomId, participantId, updateData });
    
    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Try to find participant by ID
    const participantIndex = room.participants.findIndex(p => 
      String(p.id) === String(participantId)
    );

    if (participantIndex === -1) {
      console.log('Participant not found:', participantId);
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    // Update participant data
    room.participants[participantIndex] = {
      ...room.participants[participantIndex],
      ...updateData
    };
    
    // Update room in memory
    rooms.set(roomId, room);
    
    // Broadcast updated room state to all clients
    const roomConnections = connections.get(roomId);
    if (roomConnections) {
      roomConnections.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'room_state',
            payload: room
          }));
        }
      });
    }
    
    console.log('Participant updated successfully');
    res.json({ 
      success: true, 
      participant: room.participants[participantIndex],
      room, // Send full room state
      allReady: room.participants.every(p => p.isReady)
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ message: 'Failed to update participant' });
  }
});

// Create email transporter with secure configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Test the email configuration on server start
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Test route to verify CORS
app.options('*', cors(corsOptions));

app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working' });
});

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
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

// Route to handle interview scheduling
app.post('/api/schedule-interview', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      preferredDate, 
      preferredTime, 
      collegeYear, 
      company, 
      message 
    } = req.body;

    console.log('Received interview request:', { name, email, preferredDate, preferredTime });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'techengfly@gmail.com',
      subject: `New Interview Request from ${name}`,
      text: `
Interview Request Details:

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}

Preferred Date: ${preferredDate}
Preferred Time: ${preferredTime}

College Year: ${collegeYear}
College Name: ${company}

Additional Information:
${message || 'None provided'}
      `,
      html: `
        <h2>Interview Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        
        <h3>Interview Details</h3>
        <p><strong>Preferred Date:</strong> ${preferredDate}</p>
        <p><strong>Preferred Time:</strong> ${preferredTime}</p>
        
        <h3>Candidate Information</h3>
        <p><strong>College Year:</strong> ${collegeYear}</p>
        <p><strong>College Name:</strong> ${company}</p>
        
        <h3>Additional Information</h3>
        <p>${message || 'None provided'}</p>
      `
    };

    console.log('Sending email with options:', mailOptions);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    
    res.status(200).json({ message: 'Interview request sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      message: 'Failed to send interview request', 
      error: error.message
    });
  }
});

// Routes
app.use('/api/interview', interviewRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 