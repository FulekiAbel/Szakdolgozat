import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, setDoc, collectionData, doc, deleteDoc, updateDoc, query, where, getDocs } from '@angular/fire/firestore';
import dayjs from 'dayjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AngularFireAuth } from '@angular/fire/compat/auth';

interface Goal {
  id?: string;
  title: string;
  amount: number;
  savedAmount?: number;
  targetDate: any;
  priority: string;
  frequency: string;
  notificationsEnabled: boolean;
  contributions: { amount: number; date: any }[];
  userId: string;
}

@Component({
  selector: 'app-golok',
  templateUrl: './golok.component.html',
  styleUrl: './golok.component.scss'
})

export class GolokComponent implements OnInit{

  goalForm!: FormGroup;
  goals$!: Observable<any[]>;
  goals: any[] = [];
  currentPage = 1;
  pageSize = 3;
  currentEditingId: string | null = null;
  calculatedAmount: number | null = null;
  contributionAmounts: { [goalId: string]: number } = {};
  expandedGoalId: string | null = null;
  sortBy: string = 'deadline';
  todayNotificationsByGoalId: Set<string> = new Set();
  goalsLoaded = false;
  notificationsLoaded = false;
  statusFilters = {
    completed: true,
    expired: true,
    active: true
  };
  summary = {
    active: 0,
    completed: 0,
    expired: 0,
    averageProgress: 0,
    requiredMonthlySaving: 0,
    totalRemaining: 0,
    totalSaved: 0,
    totalGoalAmount: 0
  };
  private isCheckingNotifications = false;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private message: NzMessageService,
    private fireauth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.goalForm = this.fb.group({
      title: ['', Validators.required],
      amount: [null, Validators.required],
      targetDate: [null, Validators.required],
      priority: ['Medium', Validators.required],
      frequency: ['monthly', Validators.required],
      notificationsEnabled: [true]
    });

    this.goalForm.valueChanges.subscribe(() => this.updateContributionAmount());
    this.getAllGoals();
    this.loadTodayNotifications();
    this.sortGoals();
  }

  get paginatedGoals() {
    const start = (this.currentPage - 1) * this.pageSize;
    const filtered = this.goals.filter(goal => {
      const status = this.getGoalStatus(goal);
      return this.statusFilters[status];
    });
    return filtered.slice(start, start + this.pageSize);
  }

  getSuggestedContribution(goal: any): number | null {
    if (!goal?.amount || !goal?.targetDate || !goal?.frequency) return null;
  
    const amount = Number(goal.amount);
    const savedAmount = Number(goal.savedAmount || 0);
    const remaining = amount - savedAmount;
    if (remaining <= 0) return null;
  
    const targetDate = goal.targetDate.toDate?.() ?? goal.targetDate;
    const today = dayjs();
    const end = dayjs(targetDate);
  
    const diffInMonths = end.diff(today, 'month');
    const diffInWeeks = end.diff(today, 'week');
  
    if (goal.frequency === 'monthly' && diffInMonths > 0) {
      return Math.ceil(remaining / diffInMonths);
    } else if (goal.frequency === 'weekly' && diffInWeeks > 0) {
      return Math.ceil(remaining / diffInWeeks);
    }
    return null;
  }

  updateContributionAmount(): void {
    const formValue = this.goalForm.value;
  
    this.calculatedAmount = this.getSuggestedContribution({
      amount: formValue.amount,
      targetDate: formValue.targetDate,
      frequency: formValue.frequency
    });
  }

  createGoal(): void {
    if (this.goalForm.invalid) {
      this.message.warning("Tölts ki minden mezőt!");
      return;
    }
    const data = this.goalForm.value;

    if (this.currentEditingId) {
      const ref = doc(this.firestore, `goals/${this.currentEditingId}`);
      updateDoc(ref, data).then(() => {
        this.message.success("Cél frissítve!");
        this.goalForm.reset({
          title: '',
          amount: null,
          targetDate: null,
          priority: 'Medium',
          frequency: 'monthly',
          notificationsEnabled: true});
        this.calculatedAmount = null;
        this.currentEditingId = null;
        this.getAllGoals();
      }).catch(() => {
        this.message.error("Hiba a frissítés során.");
      });
    } else {
      this.fireauth.currentUser.then(user => {
        if (!user) {
          this.message.error("Nem vagy bejelentkezve.");
          return;
        }
    
        const ref = collection(this.firestore, 'goals');
        const dataWithUserId = {
          ...data,
          userId: user.uid,
          savedAmount: 0,
          contributions: []
        };
    
        addDoc(ref, dataWithUserId).then(() => {
          this.message.success("Cél elmentve!");
          this.goalForm.reset({
            title: '',
            amount: null,
            targetDate: null,
            priority: 'Medium',
            frequency: 'monthly',
            notificationsEnabled: true
          });
          this.calculatedAmount = null;
          this.getAllGoals();
        }).catch(() => {
          this.message.error("Hiba a mentés során.");
        });
      });
    }
  }

    getAllGoals(): void {
      this.fireauth.currentUser.then(user => {
        if (!user) return;
    
        const ref = collection(this.firestore, 'goals');
        const userQuery = query(ref, where('userId', '==', user.uid));
    
        this.goals$ = collectionData(userQuery, { idField: 'id' }).pipe(
          map(data => data.map((goal: any): Goal => {
            const amount = Number(goal.amount);
            const savedAmount = Number(goal.savedAmount || 0);
            const contributions = (goal.contributions || []).map((c: any) => ({
              amount: Number(c.amount),
              date: c.date
            }));
            return {
              ...goal,
              amount,
              savedAmount,
              contributions
            };
          }))
        );
    
        this.goals$.subscribe(data => {
          this.goals = data;
          this.goalsLoaded = true;

          const totalGoals = data.length;
          const progressSum = data.reduce((sum, g) => sum + this.getProgress(g), 0);

          let monthlySavingSum = 0;
          let totalRemaining = 0;
          let totalSaved = 0;
          let totalGoalAmount = 0;
          data.forEach(goal => {
            totalSaved += Number(goal.savedAmount || 0);
            totalGoalAmount += Number(goal.amount || 0);
            if (this.getGoalStatus(goal) !== 'active') return;
    
            const suggestion = this.getSuggestedContribution(goal);
            if (!suggestion) return;
    
            if (goal.frequency === 'monthly') {
              monthlySavingSum += suggestion;
            } else if (goal.frequency === 'weekly') {
              monthlySavingSum += suggestion * 4.33; 
            }
            totalRemaining += Math.max(0, goal.amount - (goal.savedAmount || 0));
          });
    
          this.summary = {
            active: data.filter(g => this.getGoalStatus(g) === 'active').length,
            completed: data.filter(g => this.getGoalStatus(g) === 'completed').length,
            expired: data.filter(g => this.getGoalStatus(g) === 'expired').length,
            averageProgress: totalGoals ? Math.round(progressSum / totalGoals) : 0,
            requiredMonthlySaving: Math.ceil(monthlySavingSum),
            totalRemaining: totalRemaining,
            totalSaved: totalSaved,
            totalGoalAmount: totalGoalAmount
          };
          this.runNotificationCheckIfReady();
        });
      });
    }

  deleteGoal(id: string): void {
    const ref = doc(this.firestore, `goals/${id}`);
    deleteDoc(ref).then(() => {
      this.message.success("Cél törölve!");
      this.getAllGoals();
    }).catch(() => {
      this.message.error("Hiba történt a törlés során.");
    });
  }

  editGoal(goal: any): void {
    this.goalForm.patchValue({
      title: goal.title,
      amount: goal.amount,
      targetDate: goal.targetDate.toDate ? goal.targetDate.toDate() : goal.targetDate,
      priority: goal.priority,
      frequency: goal.frequency,
    });
    this.currentEditingId = goal.id;
    this.updateContributionAmount();
  }

  getProgress(goal: any): number {
    const saved = Number(goal.savedAmount || 0);
    const target = Number(goal.amount || 1);
    return Math.min(Math.round((saved / target) * 100), 100);
  }

  getTotalProgress(): number {
    const total = this.summary.totalGoalAmount || 0;
    const saved = this.summary.totalSaved || 0;
    if (total === 0) return 0;
    return Math.min(Math.round((saved / total) * 100), 100);
  }

  addContribution(goal: any): void {
    const amount = this.contributionAmounts[goal.id];
    if (!amount || amount <= 0) {
      this.message.warning("Adj meg érvényes összeget!");
      return;
    }
  
    const contribution = {
      amount,
      date: new Date()
    };
  
    const updatedSavedAmount = (goal.savedAmount || 0) + amount;
    const updatedContributions = [...(goal.contributions || []), contribution];
  
    const ref = doc(this.firestore, `goals/${goal.id}`);
    updateDoc(ref, {
      savedAmount: updatedSavedAmount,
      contributions: updatedContributions
    }).then(async () => {
      this.message.success("Hozzájárulás mentve!");
      this.contributionAmounts[goal.id] = 0;
      this.getAllGoals();

      if (updatedSavedAmount >= goal.amount) {
        const user = await this.fireauth.currentUser;
        if (!user) return;
  
        const notification = {
          goalId: goal.id,
          userId: user.uid,
          title: goal.title,
          message: `🎉 Gratulálunk! Teljesítetted a célod: "${goal.title}"`,
          date: new Date(),
          read: false,
          type: 'reminder'
        };
  
        const todayStr = new Date().toISOString().slice(0, 10);
        const notificationId = `${goal.id}_${todayStr}`;
        const ref = doc(this.firestore, `notifications/${notificationId}`);
        await setDoc(ref, { ...notification });
  
        this.message.info(`✔ Értesítés: cél teljesítve (${goal.title})`);
      }
    }).catch(() => {
      this.message.error("Hiba történt mentés közben.");
    });
  }

  fillFullAmount(goal: any): void {
    const missing = goal.amount - goal.savedAmount;
    this.contributionAmounts[goal.id] = missing > 0 ? missing : 0;
  }

  toggleGoal(id: string): void {
    this.expandedGoalId = this.expandedGoalId === id ? null : id;
  }

  getGoalStatus(goal: any): 'completed' | 'expired' | 'active' {
    const saved = Number(goal.savedAmount || 0);
    const total = Number(goal.amount || 0);
    const now = new Date();
    const target = goal.targetDate.toDate?.() ?? goal.targetDate;
  
    if (saved >= total) return 'completed';
    if (new Date(target) < now) return 'expired';
    return 'active';
  }

  toggleReminder(goal: any): void {
    const ref = doc(this.firestore, `goals/${goal.id}`);
    updateDoc(ref, { notificationsEnabled: goal.notificationsEnabled })
      .then(() => {
        const msg = goal.notificationsEnabled
          ? "Értesítés bekapcsolva ennél a célnál."
          : "Értesítés kikapcsolva.";
        this.message.success(msg);
      })
      .catch(() => {
        this.message.error("Hiba történt az emlékeztető mentése közben.");
      });
  }

  async checkDueNotifications(): Promise<void> {
    if (this.isCheckingNotifications) return;
    this.isCheckingNotifications = true;
  
    try {

    const user = await this.fireauth.currentUser;
    if (!user) return;
  
    const todayStr = new Date().toISOString().slice(0, 10);
    const notificationsRef = collection(this.firestore, 'notifications');
  
    for (const goal of this.goals) {
      if (!goal.notificationsEnabled) continue;
  
      const lastContributionDate = goal.contributions?.length
        ? new Date(goal.contributions[goal.contributions.length - 1].date.toDate?.() ?? goal.contributions[goal.contributions.length - 1].date)
        : null;
  
      const now = new Date();
      const daysSinceLast = lastContributionDate
        ? Math.floor((now.getTime() - lastContributionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
  
      const shouldNotify =
        (goal.frequency === 'weekly' && (daysSinceLast === null || daysSinceLast >= 7)) ||
        (goal.frequency === 'monthly' && (daysSinceLast === null || daysSinceLast >= 30));
  
      if (!shouldNotify) continue;
  
      const q = query(
        notificationsRef,
        where('goalId', '==', goal.id),
        where('userId', '==', user.uid),
        where('type', '==', 'reminder')
      );
  
      const snapshot = await getDocs(q);
      const alreadyNotifiedToday = snapshot.docs.some(doc => {
        const docData = doc.data();
        const docDate = docData['date'].toDate?.() ?? docData['date'];
        return docDate.toISOString().slice(0, 10) === todayStr;
      });
  
      if (alreadyNotifiedToday) continue;
  
      const notification = {
        goalId: goal.id,
        userId: user.uid,
        title: goal.title,
        message: `Ne felejts el ma félretenni a célhoz: ${goal.title}`,
        date: new Date(),
        read: false,
        type: 'reminder'
      };
  
      await addDoc(notificationsRef, notification);
      this.todayNotificationsByGoalId.add(goal.id);
      this.message.info(notification.message);
    }
  } catch (err) {
    console.error('Értesítés ellenőrzés hiba:', err);
  } finally {
    this.isCheckingNotifications = false;
    }
  }

  loadTodayNotifications(): void {
    const ref = collection(this.firestore, 'notifications');
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
  
    collectionData(ref, { idField: 'id' }).subscribe((data: any[]) => {
      this.todayNotificationsByGoalId.clear();
    
      data.forEach(n => {
        const nDate = new Date(n.date.toDate?.() ?? n.date);
        const nDateStr = nDate.toISOString().slice(0, 10);
        if (nDateStr === todayStr && n.goalId) {
          this.todayNotificationsByGoalId.add(n.goalId);
        }
      });
    
      this.notificationsLoaded = true;
      this.runNotificationCheckIfReady();
    });
  }
  runNotificationCheckIfReady(): void {
    if (this.goalsLoaded && this.notificationsLoaded) {
      this.checkDueNotifications().catch(err =>
        console.error("❗ Notification check failed:", err)
      );
    }
  }
  sortGoals(): void {
    const statusOrder: { [key: string]: number } = {
      active: 0,
      completed: 1,
      expired: 2
    };

    this.goals.sort((a, b) => {
      const statusA = this.getGoalStatus(a);
      const statusB = this.getGoalStatus(b);
  
      const statusComparison = statusOrder[statusA] - statusOrder[statusB];
      if (statusComparison !== 0) return statusComparison;

      if (this.sortBy === 'deadline') {
        return new Date(a.targetDate.toDate?.() ?? a.targetDate).getTime() -
               new Date(b.targetDate.toDate?.() ?? b.targetDate).getTime();
      } else if (this.sortBy === 'progress') {
        return this.getProgress(b) - this.getProgress(a);
      } else if (this.sortBy === 'priority') {
        const priorityMap = { High: 3, Medium: 2, Low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
  
      return 0;
    });
  }

  getMilestoneMessage(goal: any): string | null {
    const percent = this.getProgress(goal);
    if (percent >= 100) return '🎉 Gratulálunk! Elérted a célodat!';
    if (percent >= 75) return '💪 Már csak egy kicsi van hátra!';
    if (percent >= 50) return '👏 Félúton jársz – csak így tovább!';
    if (percent >= 25) return '🚀 Szép kezdés – ne add fel!';
    return null;
  }

}
