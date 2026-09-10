import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-propiedades-list',
  templateUrl: './propiedades-list.component.html',
  styleUrl: './propiedades-list.component.css',
})
export class PropiedadesListComponent {
  protected readonly title = signal('Propiedades');
}
