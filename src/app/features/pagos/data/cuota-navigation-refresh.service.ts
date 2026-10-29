import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CuotaNavigationRefreshService {
  private readonly refreshRequests = new Subject<number>();
  readonly requests$ = this.refreshRequests.asObservable();

  refresh(codcuo: number): void {
    this.refreshRequests.next(codcuo);
  }
}
