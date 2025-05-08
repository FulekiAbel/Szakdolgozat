import { Component, OnInit } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, updateDoc, Timestamp, query, where } from '@angular/fire/firestore';
import { NgZone } from '@angular/core';
import { AuthService } from './shared/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Fortunetrack';

  isNotificationModalOpen = false;
  currentPage = 1;
  itemsPerPage = 7;
  isLoggedIn = false;
  hasUnread: boolean = false;
  unreadCount: number = 0;
  userId: string | null = null;

  constructor(
    private firestore: Firestore,
    private zone: NgZone,
    private authService: AuthService,
    private fireauth: AngularFireAuth
    
  ) {}

  ngOnInit(): void {
    console.log('🔍 ngOnInit called');
    this.fireauth.authState.subscribe(user => {
      this.isLoggedIn = !!user;
      
      if (user) {
        this.userId = user.uid;
        this.subscribeToNotifications();
      }
    });
  }

notifications: {
  id?: string;
  title: string;
  message: string;
  date: Date;
  read?: boolean;
  }[] = [];

get paginatedNotifications() {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;
  return this.notifications.slice(start, end);
}

get totalPages(): number {
  return Math.ceil(this.notifications.length / this.itemsPerPage);
}

loadNotifications(): void {
  console.log('📦 Betöltjük az értesítéseket...');

  this.fireauth.currentUser.then(user => {
    if (!user) return;

    const ref = collection(this.firestore, 'notifications');
    const userQuery = query(ref, where('userId', '==', user.uid));

    collectionData(userQuery, { idField: 'id' })
      .subscribe((data: any[]) => {
        this.zone.run(() => {
          this.notifications = data.map(n => ({
            ...n,
            date: n.date.toDate ? n.date.toDate() : new Date(n.date)
          })).sort((a, b) => {
            if ((a.read ? 1 : 0) !== (b.read ? 1 : 0)) {
              return (a.read ? 1 : 0) - (b.read ? 1 : 0);
            }
            return b.date.getTime() - a.date.getTime();
          });
          this.hasUnread = this.notifications.some(n => !n.read);
          this.unreadCount = this.notifications.filter(n => !n.read).length;
        });
      });
  });
}

subscribeToNotifications(): void {
  if (!this.userId) return;

  const ref = collection(this.firestore, 'notifications');
  const userQuery = query(ref, where('userId', '==', this.userId));

  collectionData(userQuery, { idField: 'id' }).subscribe((data: any[]) => {
    this.zone.run(() => {
      this.notifications = data.map(n => ({
        ...n,
        date: n.date.toDate ? n.date.toDate() : new Date(n.date)
      })).sort((a, b) => {
        if ((a.read ? 1 : 0) !== (b.read ? 1 : 0)) {
          return (a.read ? 1 : 0) - (b.read ? 1 : 0);
        }
        return b.date.getTime() - a.date.getTime();
      });

      this.hasUnread = this.notifications.some(n => !n.read);
      this.unreadCount = this.notifications.filter(n => !n.read).length;
    });
  });
}

markAsRead(notificationId: string): void {
  const ref = doc(this.firestore, `notifications/${notificationId}`);
  updateDoc(ref, { read: true });
}

openNotificationModal(): void {
  this.isNotificationModalOpen = true;
}
  logout(): void {
    this.authService.logout(); 
  }

}
