import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FriendRequestsPage } from './friend-requests.page';

describe('FriendRequestsPage', () => {
  let component: FriendRequestsPage;
  let fixture: ComponentFixture<FriendRequestsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FriendRequestsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
