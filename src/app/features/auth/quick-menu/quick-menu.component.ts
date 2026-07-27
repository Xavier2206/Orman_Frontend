import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

type QuickMenuOrigin = 'desktop' | 'mobile';

@Component({
  selector: 'app-quick-menu',
  templateUrl: './quick-menu.component.html',
  styleUrl: './quick-menu.component.css',
})
export class QuickMenuComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly connectButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('connectButton');

  readonly origin = input<QuickMenuOrigin>('desktop');
  readonly close = output<void>();
  readonly connect = output<void>();

  constructor() {
    afterNextRender(() => this.connectButton().nativeElement.focus());
  }

  protected requestClose(): void {
    this.close.emit();
  }

  protected requestConnect(): void {
    this.connect.emit();
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerdown(event: PointerEvent): void {
    const target = event.target;
    const anchorContainer = this.hostElement.nativeElement.parentElement;
    const boundary =
      this.origin() === 'desktop' && anchorContainer?.hasAttribute('data-quick-menu-anchor')
        ? anchorContainer
        : this.panel().nativeElement;

    if (target instanceof Node && boundary && !boundary.contains(target)) {
      this.requestClose();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
    }
  }
}
