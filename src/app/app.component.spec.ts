import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app.component';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

describe('App', () => {
  beforeEach(async () => {
    if (typeof window.matchMedia !== 'function') {
      window.matchMedia = (() => ({
        addEventListener: () => undefined,
        matches: false,
        removeEventListener: () => undefined,
      })) as unknown as typeof window.matchMedia;
    }

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should contain the router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('should load the public layout and landing page at the root route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-public-layout')).toBeTruthy();
    expect(element.querySelector('app-landing')).toBeTruthy();
    expect(element.querySelector('h1')?.textContent).toContain(
      'Encuentra el espacio ideal para ti',
    );
  });

  it('should redirect an unauthenticated visitor from /app/inicio to /', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    TestBed.inject(AuthService).clearSession();
    fixture.detectChanges();

    await router.navigateByUrl('/app/inicio');

    expect(router.url).toBe('/');
  });

  it('should redirect /app to the authenticated private start', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const auth = TestBed.inject(AuthService);
    auth.login('usuario.demo', 'password-demo').subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/auth/login').flush({
      status: 'AUTHENTICATED',
      login: 'usuario.demo',
      codper: 10,
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'sid',
    });
    fixture.detectChanges();

    await router.navigateByUrl('/app');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/app/inicio');
    expect(fixture.nativeElement.querySelector('app-private-layout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-inicio')).toBeTruthy();
  });
});
