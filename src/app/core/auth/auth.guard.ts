import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.state).pipe(
    filter((state) => state !== 'checking'),
    take(1),
    map((state) => (state === 'authenticated' ? true : router.createUrlTree(['/']))),
  );
};
