import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GolokComponent } from './golok.component';

describe('GolokComponent', () => {
  let component: GolokComponent;
  let fixture: ComponentFixture<GolokComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GolokComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GolokComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
