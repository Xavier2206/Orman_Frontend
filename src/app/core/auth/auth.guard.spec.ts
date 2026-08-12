import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should allow an authenticated session', async () => {
    auth.login('usuario.demo', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login')
      .flush({ status: 'AUTHENTICATED', login: 'usuario.demo', codper: 10, accessToken: 'token', tokenType: 'Bearer', expiresIn: 900, sid: 'sid' });

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({} as never, {} as never) as Observable<boolean | UrlTree>),
    );
    expect(result).toBe(true);
  });

  it('should redirect an unauthenticated session to the public root', async () => {
    auth.clearSession();
    const router = TestBed.inject(Router);
    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({} as never, {} as never) as Observable<boolean | UrlTree>),
    );

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/');
  });

  it('should wait while the authentication bootstrap is checking', async () => {
    let resolved = false;
    const result = TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({} as never, {} as never) as Observable<boolean | UrlTree>),
    ).then((value) => {
      resolved = true;
      return value;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    auth.clearSession();
    expect(TestBed.inject(Router).serializeUrl((await result) as ReturnType<Router['createUrlTree']>)).toBe('/');
  });
});
