import { Component, HostListener } from "@angular/core";

@Component({
  selector: 'app-ma-tuck-ins',
  templateUrl: './ma-tuck-ins.component.html',
  styleUrls: ['./ma-tuck-ins.component.css']
})
export class MaTuckInsComponent {
  steps = [
    { label: 'Choose AMS Source', description: 'Select the system you are importing from' },
    { label: 'Choose AMS Target', description: 'Select the destination system and organization details' },
    { label: 'Settings' },
    { label: 'Test import' },
    { label: 'QA Reconciliation' },
  ];

  // Default active step: Choose AMS Source
  currentStep = 0;

  amsSources: Array<{ id: string; name: string; color: string }> = [];
  selectedSourceId: string | null = null;
  selectedTargetId: string | null = null;
  destinationOrgName: string = '';
  destinationNotes: string = '';

  ngOnInit() {
    fetch('/assets/ams-sources.json')
      .then((r) => r.json())
      .then((data) => (this.amsSources = data))
      .catch(() => {
        this.amsSources = [];
      });
  }

  onSelectSource(id: string) {
    this.selectedSourceId = id;
  }

  onSelectTarget(id: string) {
    this.selectedTargetId = id;
  }

  nextStep(): void {
    const next = Math.min(this.currentStep + 1, this.steps.length - 1);
    this.goToStep(next);
  }

  prevStep(): void {
    const prev = Math.max(this.currentStep - 1, 0);
    this.goToStep(prev);
  }

  isCompleted(index: number): boolean {
    return index < this.currentStep;
  }

  isActive(index: number): boolean {
    return index === this.currentStep;
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.currentStep = index;
    }
  }

  // keyboard accessibility for step navigation
  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      this.goToStep(Math.min(this.currentStep + 1, this.steps.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      this.goToStep(Math.max(this.currentStep - 1, 0));
      e.preventDefault();
    }
  }
}
