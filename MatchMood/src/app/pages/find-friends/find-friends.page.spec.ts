import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FindFriendsPage } from './find-friends.page';

describe('FindFriendsPage', () => {
  let component: FindFriendsPage;
  let fixture: ComponentFixture<FindFriendsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FindFriendsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
