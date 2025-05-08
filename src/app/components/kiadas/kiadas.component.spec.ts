import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KiadasComponent } from './kiadas.component';

describe('KiadasComponent', () => {
  let component: KiadasComponent;
  let fixture: ComponentFixture<KiadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KiadasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KiadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
