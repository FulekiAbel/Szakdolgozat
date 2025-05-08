import { Component, ElementRef, Injectable, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KiadasService } from '../../services/kiadas/kiadas.service';
import { Firestore, collection, addDoc, collectionData, doc, deleteDoc, updateDoc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import Chart from 'chart.js/auto';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-kiadas',
  templateUrl: './kiadas.component.html',
  styleUrl: './kiadas.component.scss'
})


export class KiadasComponent implements OnInit {

  expenseForm!: FormGroup;
  expenses$!: Observable<any[]>;
  listOfCategory: any[] = ["Élelmiszer", "Közlekedés", "Lakhatás", "Egészség", "Szórakozás","Ruházat", "Oktatás", "Ajándék", "Egyéb"]
  currentEditingId: string | null = null;
  private expensePieChart: Chart | null = null;
  expenses: any[] = [];
  currentPage: number = 1;
  pageSize: number = 5;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private message: NzMessageService,
    private kiadasService: KiadasService,
    private fireauth: AngularFireAuth
  ) {}


  ngOnInit(){
    this.expenseForm = this.fb.group({
      title: [null, Validators.required],
      amount: [null, Validators.required],
      date: [null, Validators.required],
      category: [null, Validators.required],
      description: [null, Validators.required],
    });
    this.getAllExpenses();
  }

  get paginatedIncomes() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.expenses.slice(start, start + this.pageSize);
  }

  submitForm(): void {
    if (this.expenseForm.valid) {
      const data = this.expenseForm.value;
  
      if (this.currentEditingId) {
        const docRef = doc(this.firestore, `expenses/${this.currentEditingId}`);
        updateDoc(docRef, data)
          .then(() => {
            this.message.success("Kiadás frissítve!");
            this.expenseForm.reset();
            this.currentEditingId = null;
            this.getAllExpenses();
          })
          .catch((error) => {
            console.error(error);
            this.message.error("Frissítés sikertelen.");
          });
      } else {
        this.fireauth.currentUser.then(user => {
          if (!user) {
            this.message.error("Nem vagy bejelentkezve.");
            return;
          }
  
          const ref = collection(this.firestore, 'expenses');
          const dataWithUserId = { ...data, userId: user.uid };
  
          addDoc(ref, dataWithUserId)
            .then(() => {
              this.message.success("Kiadás mentve!");
              this.expenseForm.reset();
              this.getAllExpenses();
            })
            .catch((error) => {
              console.error(error);
              this.message.error("Hiba a mentéskor.");
            });
        });
      }
    } else {
      this.message.warning("Tölts ki minden mezőt!");
    }
  }


  getAllExpenses(): void {
    this.fireauth.currentUser.then(user => {
      if (!user) return;
  
      const ref = collection(this.firestore, 'expenses');
      const userQuery = query(ref, where('userId', '==', user.uid));
  
      this.expenses$ = collectionData(userQuery, { idField: 'id' });
  
      this.expenses$.subscribe(data => {
        this.expenses = data;
        this.createExpensePieChart();
      });
    });
  }

  deleteExpense(id: string): void {
    const expenseDocRef = doc(this.firestore, `expenses/${id}`);
    deleteDoc(expenseDocRef)
      .then(() => {
        this.message.success("Kiadás törölve!");
        this.getAllExpenses(); 
      })
      .catch((error) => {
        console.error(error);
        this.message.error("Hiba történt a törlés közben.");
      });
  }

  editExpense(expense: any): void {
    this.expenseForm.patchValue({
      title: expense.title,
      amount: expense.amount,
      date: expense.date.toDate(),
      category: expense.category,
      description: expense.description
    });
    this.currentEditingId = expense.id;
  }


  @ViewChild('expensePieChartRef') private expensePieChartRef: ElementRef;
  createExpensePieChart() {
    const ctx = this.expensePieChartRef.nativeElement.getContext('2d');
  
    const categoryMap: { [key: string]: number } = {};
  
    this.expenses.forEach(expense => {
      const category = expense.category || 'Egyéb';
      const amount = Number(expense.amount) || 0;
      categoryMap[category] = (categoryMap[category] || 0) + amount;
    });
  
    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    if (this.expensePieChart) {
      this.expensePieChart.destroy();
    }
  
    this.expensePieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0',
            '#9966ff', '#ff9f40', '#66bb6a', '#ef5350', '#42a5f5'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: {
                size: 10
              },
              padding: 15,
              usePointStyle: true
            }
          }
        }
      }
    });
  }
}
