import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { AppComponent } from "./app.component";
import { CsrAssistCardComponent } from "./csr-assist-card/csr-assist-card.component";
import { MaTuckInsComponent } from "./ma-tuck-ins/ma-tuck-ins.component";
import { AppRoutingModule } from "./app-routing.module";
import { AmsCardComponent } from "./ams-card/ams-card.component";
import { ChatComponent } from "./chat/chat.component";

@NgModule({
  declarations: [AppComponent, CsrAssistCardComponent, MaTuckInsComponent, AmsCardComponent, ChatComponent],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
