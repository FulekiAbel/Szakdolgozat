import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArfolyamComponent } from './arfolyam.component';

describe('ArfolyamComponent', () => {
  let component: ArfolyamComponent;
  let fixture: ComponentFixture<ArfolyamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArfolyamComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArfolyamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
