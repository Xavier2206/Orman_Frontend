import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PublicFooterComponent } from '../../features/public/landing/components/public-footer/public-footer.component';
import { PublicHeaderComponent } from '../../features/public/landing/components/public-header/public-header.component';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {}
