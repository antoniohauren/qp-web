import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the logo and customer area button', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.logo')?.textContent).toBe('Passagens');
    expect(element.querySelector<HTMLAnchorElement>('.logo')?.getAttribute('href')).toBe('/');
    expect(element.querySelector('button')?.textContent?.trim()).toBe(
      'Área do cliente',
    );
    expect(element.querySelector('button')?.type).toBe('button');
  });
});
