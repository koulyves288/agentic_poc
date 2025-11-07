import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService, ChatMessage, Participant } from './chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  participants: Participant[] = [];
  isConnected = false;
  currentMessage = '';
  showAgentsSidebar = false;
  isFullChat = false;
  isThinking = false;

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages;
      })
    );

    // Subscribe to participants
    this.subscriptions.push(
      this.chatService.participants$.subscribe(list => {
        this.participants = list;
        this.showAgentsSidebar = list.length > 0;
        // Dispatch custom event so AppComponent can mirror participants in sidebar
        try {
          window.dispatchEvent(new CustomEvent('participants-update', { detail: list }));
        } catch (_) { /* ignore */ }
      })
    );

    // Subscribe to connection status
    this.subscriptions.push(
      this.chatService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );

    // Subscribe to thinking indicator
    this.subscriptions.push(
      this.chatService.thinking$.subscribe(t => {
        this.isThinking = t;
      })
    );
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }

  onSendMessage(): void {
    const message = this.currentMessage.trim();
    if (message) {
      this.chatService.sendMessage(message);
      this.currentMessage = '';
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  onReplayClearChat(): void {
    this.chatService.clearChat();
  }

  onToggleFullChat(): void {
    this.isFullChat = !this.isFullChat;
  }

  onToggleAgentsSidebar(): void {
    // Toggle the left sidebar participants section in AppComponent
    try {
      window.dispatchEvent(new CustomEvent('participants-toggle'));
    } catch (_) {
      // no-op
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getMessageClass(message: ChatMessage): string {
    return message.sender === 'user' ? 'chat__message--user' : 'chat__message--agent';
  }

  getAgentDisplayName(message: ChatMessage): string {
    if (message.sender === 'user') return 'You';
    // Prefer peerName if this is a human participant's message routed as non-user
    if (message.peerName) return message.peerName;
    return message.agentType || 'Assistant';
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}