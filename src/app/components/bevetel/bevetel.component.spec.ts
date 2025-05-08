import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BevetelComponent } from './bevetel.component';

describe('BevetelComponent', () => {
  let component: BevetelComponent;
  let fixture: ComponentFixture<BevetelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BevetelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BevetelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
