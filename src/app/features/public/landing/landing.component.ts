import { Component } from '@angular/core';

import { HeroSectionComponent } from './components/hero-section/hero-section.component';

@Component({
  selector: 'app-landing',
  imports: [HeroSectionComponent],
  templateUrl: './landing.component.html',
})
export class LandingComponent {}
