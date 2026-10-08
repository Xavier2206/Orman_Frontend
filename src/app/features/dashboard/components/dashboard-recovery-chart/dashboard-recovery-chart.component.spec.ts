import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRecoveryChartComponent } from './dashboard-recovery-chart.component';

describe('DashboardRecoveryChartComponent', () => {
  let fixture: ComponentFixture<DashboardRecoveryChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRecoveryChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRecoveryChartComponent);
    fixture.componentRef.setInput('scopeLabel', 'Edificio Central');
    fixture.componentRef.setInput('investmentAmount', 1000);
    fixture.componentRef.setInput('confirmedIncomeAmount', 1.1);
  });

  it('preserves a small real percentage in the center and draws its proportional donut segment', () => {
    fixture.componentRef.setInput('percentage', 0.11);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector(
      '.recovery-ring-progress',
    ) as SVGCircleElement;
    const expectedCircumference = 2 * Math.PI * 48;

    expect(fixture.nativeElement.textContent).toContain('0,11 %');
    expect(Number(progress.getAttribute('stroke-dashoffset'))).toBeCloseTo(
      expectedCircumference * (1 - 0.11 / 100),
      8,
    );
    expect(fixture.nativeElement.textContent).toContain('Bs 1,10');
    expect(fixture.nativeElement.textContent).toContain('Bs 1.000,00');
  });

  it('shows no calculable without drawing a misleading ring when investment is zero', () => {
    fixture.componentRef.setInput('investmentAmount', 0);
    fixture.componentRef.setInput('percentage', 0);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No calculable');
    expect(fixture.nativeElement.querySelector('.recovery-ring')).toBeNull();
    expect(fixture.nativeElement.querySelector('.recovery-ring-progress')).toBeNull();
  });

  it('fills the ring at the visual limit while retaining a backend percentage above 100 percent', () => {
    fixture.componentRef.setInput('percentage', 135);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector(
      '.recovery-ring-progress',
    ) as SVGCircleElement;

    expect(fixture.nativeElement.textContent).toContain('135,00 %');
    expect(progress.getAttribute('stroke-dashoffset')).toBe('0');
    expect(fixture.nativeElement.textContent).toContain('100,00 %');
  });
});
