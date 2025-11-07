import { Component, Input } from "@angular/core";

@Component({
  selector: "app-csr-assist-card",
  templateUrl: "./csr-assist-card.component.html",
  styleUrls: ["./csr-assist-card.component.css"],
})
export class CsrAssistCardComponent {
  @Input() status: "active" | "available" | "unavailable" = "available";
  @Input() icon = "assets/csrassistcard/csrassist_icon.svg";
  @Input() title = "CSR Assist";
  @Input() color = "#CF1B53";
  @Input() subtitle = "Customer Service Representative Support";

  get chipBackground(): string {
    // Provide sensible defaults per status; caller can override via inputs
    const map: Record<string, string> = {
      active: "rgba(240,154,181,0.5)",
      available: "rgba(200,200,200,0.5)",
      unavailable: "rgba(200,200,200,0.5)",
    };
    return map[this.status] || map["available"];
  }
}
