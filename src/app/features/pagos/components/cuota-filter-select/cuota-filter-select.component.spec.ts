import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CuotaFilterSelectComponent } from './cuota-filter-select.component';

describe('CuotaFilterSelectComponent', () => {
  let fixture: ComponentFixture<CuotaFilterSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuotaFilterSelectComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CuotaFilterSelectComponent);
    fixture.componentRef.setInput('filterId', 'tenant');
    fixture.componentRef.setInput('label', 'Inquilino');
    fixture.componentRef.setInput('options', [
      { value: '', label: 'Todos los inquilinos' },
      { value: '15', label: 'Valeria Mendoza' },
    ]);
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
  });

  it('exposes an accessible listbox trigger and selected option', () => {
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    fixture.detectChanges();

    const listbox = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    const selectedOption = fixture.nativeElement.querySelector('[aria-selected="true"]');

    expect(listbox.getAttribute('aria-labelledby')).toBe('tenant-label');
    expect(selectedOption?.textContent).toContain('Todos los inquilinos');
  });

  it('selects an option by click and restores focus to the trigger', async () => {
    const selectionChange = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selectionChange);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('[role="option"]')[1] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(selectionChange).toHaveBeenCalledWith('15');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('button'));
  });

  it('keeps a mouse option clickable when focus leaves before the click event', async () => {
    const selectionChange = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selectionChange);
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await Promise.resolve();

    const option = fixture.nativeElement.querySelectorAll('[role="option"]')[1] as HTMLElement;
    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);
    outsideButton.focus();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="listbox"]')).not.toBeNull();

    option.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(selectionChange).toHaveBeenCalledWith('15');
    expect(document.activeElement).toBe(trigger);
    outsideButton.remove();
  });

  it('supports Arrow navigation, Space selection, and Escape focus restoration', async () => {
    const selectionChange = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selectionChange);
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    (options[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await fixture.whenStable();
    expect(document.activeElement).toBe(options[1]);

    (options[1] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(selectionChange).toHaveBeenCalledWith('15');
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const currentOption = fixture.nativeElement.querySelector('[role="option"]') as HTMLElement;
    currentOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the trigger disabled while its catalog is loading', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(trigger.disabled).toBe(true);
    expect(trigger.getAttribute('aria-busy')).toBe('true');
  });
});
