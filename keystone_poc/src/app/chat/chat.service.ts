import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentType?: 'Elf' | 'Hobbit' | 'Wizard' | 'WorkflowLLM' | 'CSR Assist Agent';
  timestamp: Date;
  avatar?: string;
  // For messages coming from other human participants
  peerName?: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private ws: WebSocket | null = null;
  private readonly WS_URL = 'ws://localhost:8010';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly defaultRoomId = 'default';
  private readonly localUser: Participant;
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! How may I help',
      sender: 'agent',
      agentType: 'CSR Assist Agent',
      timestamp: new Date(),
      avatar: 'assets/csrassist/csrassist_avatar.jpg'
    }
  ]);
  
  private participantsSubject = new BehaviorSubject<Participant[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private thinkingSubject = new BehaviorSubject<boolean>(false);
  
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();
  public participants$: Observable<Participant[]> = this.participantsSubject.asObservable();
  public connectionStatus$: Observable<boolean> = this.connectionStatusSubject.asObservable();
  public thinking$: Observable<boolean> = this.thinkingSubject.asObservable();
  
  private readonly agentAvatars = {
    Elf: 'assets/agents/elf-avatar.svg',
    Hobbit: 'assets/agents/hobbit-avatar.svg',
    Wizard: 'assets/agents/wizard-avatar.svg',
    'CSR Assist Agent': 'assets/csrassist/csrassist_avatar.jpg'
  };

  constructor() {
    // Initialize identity
    const storedId = localStorage.getItem('chatUserId');
    const storedName = localStorage.getItem('chatUserName');
    const id = storedId || `u-${Math.random().toString(36).slice(2, 10)}`;
    const name = storedName || `User-${id.slice(-4)}`;
    this.localUser = { id, name, avatar: null };
    if (!storedId) localStorage.setItem('chatUserId', id);
    if (!storedName) localStorage.setItem('chatUserName', name);

    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.WS_URL);
      
      this.ws.onopen = () => {
        console.log('Connected to Gateway');
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
        this.addSystemMessage('🔗 Connected to Gateway');
        // Join default room
        this.sendJson({
          type: 'join',
          roomId: this.defaultRoomId,
          user: { id: this.localUser.id, name: this.localUser.name, avatar: this.localUser.avatar }
        });
      };
      
      this.ws.onmessage = (event) => {
        this.handleGatewayMessage(event.data);
      };
      
      this.ws.onclose = () => {
        console.log('Disconnected from Gateway');
        this.connectionStatusSubject.next(false);
        this.addSystemMessage('🔌 Disconnected from Gateway');
        this.thinkingSubject.next(false);
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.addSystemMessage('❌ Connection error');
        this.thinkingSubject.next(false);
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      this.addSystemMessage('❌ Failed to connect to Gateway');
      this.attemptReconnect();
    }
  }
  
  private handleGatewayMessage(raw: any): void {
    try {
      const data = JSON.parse(raw);
      switch (data.type) {
        case 'participants': {
          const list: Participant[] = data.participants || [];
          this.participantsSubject.next(list);
          break;
        }
        case 'participant_joined': {
          const current = this.participantsSubject.value;
          const p: Participant = data.participant;
          const exists = current.some(x => x.id === p.id);
          this.participantsSubject.next(exists ? current : [...current, p]);
          this.addSystemMessage(`👋 ${p.name} joined`);
          break;
        }
        case 'participant_left': {
          const current = this.participantsSubject.value.filter(x => x.id !== data.participant?.id);
          this.participantsSubject.next(current);
          this.addSystemMessage(`👋 ${data.participant?.name || 'Someone'} left`);
          break;
        }
        case 'typing': {
          // Typing events can update UI later
          break;
        }
        case 'user_message': {
          const msg = data.message;
          const isSelf = msg.userId === this.localUser.id;
          if (isSelf) {
            // We already added our message optimistically; ignore echoed self message
            break;
          }
          // Try to resolve participant name for non-self messages
          const p = (this.participantsSubject.value || []).find(x => x.id === msg.userId);
          const chatMsg: ChatMessage = {
            id: msg.id || Date.now().toString(),
            content: msg.content,
            sender: 'agent',
            timestamp: new Date(msg.timestamp || Date.now()),
            avatar: p?.avatar || 'assets/csrassist/csrassist_header_icon.svg',
            peerName: p?.name || 'Participant'
          };
          this.messagesSubject.next([...this.messagesSubject.value, chatMsg]);
          break;
        }
        case 'agent_message': {
          const msg = data.message;
          const chatMsg: ChatMessage = {
            id: msg.id || Date.now().toString(),
            content: msg.content,
            sender: 'agent',
            agentType: 'CSR Assist Agent',
            timestamp: new Date(msg.timestamp || Date.now()),
            avatar: 'assets/csrassist/csrassist_avatar.jpg'
          };
          this.messagesSubject.next([...this.messagesSubject.value, chatMsg]);
          this.thinkingSubject.next(false);
          break;
        }
        case 'thinking': {
          this.thinkingSubject.next(!!data.value);
          break;
        }
        case 'system': {
          if (data.message) this.addSystemMessage(data.message);
          break;
        }
        default:
          break;
      }
    } catch {
      // ignore
    }
  }

  private addSystemMessage(content: string): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'agent',
      agentType: 'CSR Assist Agent',
      timestamp: new Date(),
      avatar: 'assets/csrassist/csrassist_avatar.jpg'
    };
    
    const messages = this.messagesSubject.value;
    this.messagesSubject.next([...messages, message]);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  sendMessage(content: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.addSystemMessage('❌ Not connected. Message not sent.');
      return;
    }

    const trimmed = content.trim();
    const isDirectedToAgent = trimmed.startsWith('@');

    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    this.messagesSubject.next([...this.messagesSubject.value, userMessage]);

    // Send structured payload to gateway
    this.sendJson({
      type: 'user_message',
      roomId: this.defaultRoomId,
      userId: this.localUser.id,
      content
    });
    // Only show thinking when message is directed to AI (starts with '@')
    this.thinkingSubject.next(isDirectedToAgent);
  }

  clearChat(): void {
    this.messagesSubject.next([{
      id: '1',
      content: 'Hello! How may I help',
      sender: 'agent',
      agentType: 'CSR Assist Agent',
      timestamp: new Date(),
      avatar: 'assets/csrassist/csrassist_avatar.jpg'
    }]);
    this.participantsSubject.next([]);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private sendJson(payload: any): void {
    try {
      this.ws?.send(JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to send JSON payload', e);
    }
  }
}