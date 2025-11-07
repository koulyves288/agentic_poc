import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "Agency Assist Dashboard";
  participants: { id: string; name: string; avatar: string | null }[] = [];
  showSidebarParticipants = true;

  menuItems = [
    { label: "Home", icon: "assets/menu/home_menu_item.svg" },
    { label: "Dashboard", icon: "assets/menu/dashboard_menu_item.svg" },
    { label: "Teams", icon: "assets/menu/teams_menu_item.svg" },
    { label: "Users", icon: "assets/menu/users_menu_item.svg" },
  ];

  notificationItem = {
    label: "Notifications",
    icon: "assets/menu/notifications_menu_item.svg",
  };

  assistants: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Participants are emitted from ChatService; expose them on AppComponent via window event bridge.
    // The chat component will dispatch a CustomEvent('participants-update', {detail: participants}) when list changes.
    window.addEventListener('participants-update', (ev: any) => {
      if (ev?.detail && Array.isArray(ev.detail)) {
        this.participants = ev.detail;
      }
    });

    // Listen for toggle events dispatched from chat component
    window.addEventListener('participants-toggle', () => {
      this.showSidebarParticipants = !this.showSidebarParticipants;
    });

    // Load assistants list from assets JSON
    fetch('/assets/ai-assistants.json')
      .then((r) => r.json())
      .then((data) => (this.assistants = data))
      .catch(() => {
        // fallback to a minimal built-in list if fetch fails
        this.assistants = [
          {
            status: 'active',
            icon: 'assets/csrassistcard/csrassist_icon.svg',
            title: 'CSR Assist',
            color: '#CF1B53',
            subtitle: 'Customer Service Representative Support',
          },
        ];
      });
  }

  get isMaTuckInsRoute(): boolean {
    return this.router.url.startsWith('/ma-tuck-ins');
  }

  onAssistantClick(a: any): void {
    const norm = (a?.title || '')
      .toString()
      .toLowerCase()
      .replace(/[^a-z]/g, ''); // strip spaces, symbols
    if (norm.includes('matuckins')) {
      this.router.navigate(["/ma-tuck-ins"]);
    }
  }
}
