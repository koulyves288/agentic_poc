import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

// Config
const GATEWAY_PORT = process.env.GATEWAY_PORT ? Number(process.env.GATEWAY_PORT) : 8010;
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'ws://localhost:8003/ws';

// Room state: roomId -> { clients: Set<ws>, participants: Map<ws, participant>, orchestrator?: ws, pending: string[] }
const rooms = new Map();

// Safely coerce any incoming WebSocket message payload to a string
function toStringData(data) {
  if (typeof data === 'string') return data;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) return data.toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  try { return String(data); } catch { return ''; }
}

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Set(),
      participants: new Map(),
      orchestrator: null,
      orchestratorReady: false,
      pending: []
    });
  }
  return rooms.get(roomId);
}

function broadcast(room, payload, excludeWs = null) {
  const data = JSON.stringify(payload);
  for (const client of room.clients) {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      try {
        const info = client._clientInfo || {};
        const url = info.host ? `${info.proto || 'ws'}://${info.host}${info.path || '/'}` : `${info.addr || 'unknown'}:${info.port || ''}`;
        console.log('websocket url broadcast:', url);
      } catch (_) {
        // ignore any logging issues
      }
      client.send(data);
    }
  }
}

function participantsList(room) {
  const list = [];
  for (const [, participant] of room.participants.entries()) {
    list.push({ id: participant.id, name: participant.name, avatar: participant.avatar || null });
  }
  return list;
}

function ensureOrchestratorForRoom(roomId) {
  const room = getOrCreateRoom(roomId);
  if (room.orchestrator && room.orchestrator.readyState === WebSocket.OPEN) {
    return room.orchestrator;
  }
  const ws = new WebSocket(ORCHESTRATOR_URL);
  room.orchestrator = ws;
  room.orchestratorReady = false;

  ws.on('open', () => {
    room.orchestratorReady = true;
    // Send initial handshake message to WorkflowLLM
    ws.send('Gateway connected and ready');
    // Optionally notify room that orchestrator is connected
    broadcast(room, { type: 'system', message: 'Orchestrator connected' });

    // Flush any queued user messages
    try {
      while (room.pending.length > 0 && ws.readyState === WebSocket.OPEN) {
        const msg = room.pending.shift();
        ws.send(msg);
      }
    } catch (e) {
      console.error('Error flushing pending messages:', e?.message || e);
    }
  });

  ws.on('message', (data) => {
    let content = toStringData(data);
    try {
      const parsed = JSON.parse(content);
      // Filter out non-user-facing control messages
      if (parsed && typeof parsed === 'object') {
        const controlTypes = new Set(['ping', 'pong', 'handshake_ack']);
        if (parsed.type && controlTypes.has(parsed.type)) {
          return; // ignore
        }
        if (parsed.error && typeof parsed.error === 'string' && parsed.error.toLowerCase().includes('timeout waiting for message')) {
          return; // ignore noisy timeouts
        }
        if (parsed.content) content = parsed.content;
        else if (parsed.text) content = parsed.text;
      }
    } catch (_) {
      // keep as text if not JSON
    }
    // Forward as agent_message
    broadcast(room, {
      type: 'agent_message',
      roomId,
      message: {
        id: uuidv4(),
        content,
        agent: 'CSR Assist Agent',
        timestamp: new Date().toISOString()
      }
    });
    // Also signal thinking false explicitly
    broadcast(room, { type: 'thinking', roomId, value: false });
  });

  ws.on('close', () => {
    room.orchestrator = null;
    room.orchestratorReady = false;
    broadcast(room, { type: 'system', message: 'Orchestrator disconnected' });
  });

  ws.on('error', (err) => {
    console.error('Orchestrator error:', err?.message || err);
    broadcast(room, { type: 'system', message: 'Orchestrator error' });
  });

  return ws;
}

const wss = new WebSocketServer({ port: GATEWAY_PORT });
console.log(`[Gateway] WebSocket gateway listening on ws://localhost:${GATEWAY_PORT}`);
console.log(`[Gateway] Orchestrator URL: ${ORCHESTRATOR_URL}`);

wss.on('connection', (ws, req) => {
  // Attach client connection details for logging
  try {
    const isSecure = !!(req?.socket && req.socket.encrypted);
    const proto = (req?.headers && req.headers['x-forwarded-proto']) || (isSecure ? 'wss' : 'ws');
    const host = req?.headers?.host || 'unknown-host';
    const path = req?.url || '/';
    const addr = req?.socket?.remoteAddress;
    const port = req?.socket?.remotePort;
    ws._clientInfo = { proto, host, path, addr, port };
  } catch (_) { /* best-effort only */ }
  let joinedRoomId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch (_) {
      // Ignore non-JSON messages for gateway
      return;
    }

    const { type } = msg || {};

    // JOIN ROOM
    if (type === 'join') {
      const { roomId, user } = msg;
      if (!roomId || !user || !user.id || !user.name) return;

      const room = getOrCreateRoom(roomId);
      room.clients.add(ws);
      room.participants.set(ws, { id: user.id, name: user.name, avatar: user.avatar || null });
      joinedRoomId = roomId;

      // Send participants list to the new client
      ws.send(JSON.stringify({ type: 'participants', roomId, participants: participantsList(room) }));
      // Announce join
      broadcast(room, { type: 'participant_joined', roomId, participant: { id: user.id, name: user.name, avatar: user.avatar || null } }, ws);
    }

    // TYPING
    else if (type === 'typing') {
      const { roomId, userId, isTyping } = msg;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      broadcast(room, { type: 'typing', roomId, userId, isTyping }, ws);
    }

    // USER MESSAGE
    else if (type === 'user_message') {
      const { roomId, userId, content } = msg;
      if (!roomId || !content) return;
      const room = rooms.get(roomId);
      if (!room) return;

      // Broadcast user's message to room
      const messagePayload = {
        type: 'user_message',
        roomId,
        message: {
          id: uuidv4(),
          content,
          userId,
          timestamp: new Date().toISOString()
        }
      };
      broadcast(room, messagePayload);
      
        // Route to AI orchestrator only if message starts with '@'
        const trimmed = content.trim();
        const isDirectedToAgent = trimmed.startsWith('@');
        if (!isDirectedToAgent) {
          // Do NOT involve the AI; no thinking indicator
          console.log(`[Gateway] Human-only message (no @). Not sending to AI. room=${roomId}`);
          return;
        }

        // Remove leading '@' and any following space before sending to AI
        const contentForAgent = trimmed.slice(1).trimStart();
        if (!contentForAgent) {
          return; // nothing meaningful to send
        }

        // Signal thinking to all when contacting AI
        broadcast(room, { type: 'thinking', roomId, value: true });

        const orchestrator = ensureOrchestratorForRoom(roomId);
        if (orchestrator && orchestrator.readyState === WebSocket.OPEN) {
          console.log(`[Gateway] Forwarding to AI: ${contentForAgent}`);
          orchestrator.send(contentForAgent);
        } else {
          // Queue for orchestrator once it is open
          console.log(`[Gateway] Orchestrator not open; queueing for AI: ${contentForAgent}`);
          room.pending.push(contentForAgent);
      }
    }
  });

  ws.on('close', () => {
    if (!joinedRoomId) return;
    const room = rooms.get(joinedRoomId);
    if (!room) return;

    const participant = room.participants.get(ws);
    room.participants.delete(ws);
    room.clients.delete(ws);

    if (participant) {
      broadcast(room, { type: 'participant_left', roomId: joinedRoomId, participant: { id: participant.id, name: participant.name } });
    }

    // If room empty, close orchestrator connection
    if (room.clients.size === 0 && room.orchestrator) {
      try { room.orchestrator.close(); } catch (_) {}
      room.orchestrator = null;
      room.orchestratorReady = false;
    }
  });
});
