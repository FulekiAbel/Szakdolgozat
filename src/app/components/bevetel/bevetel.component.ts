import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import {  Firestore,  collection,  addDoc, collectionData,  doc,  deleteDoc,  updateDoc, query, where} from '@angular/fire/firestore';
import { Observable } from 'rxjs'
import Chart from 'chart.js/auto';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-bevetel',
  templateUrl: './bevetel.component.html',
  styleUrl: './bevetel.component.scss'
})
export class BevetelComponent implements OnInit {
  incomeForm!: FormGroup;
  incomes$!: Observable<any[]>;
  listOfCategory: any[] = ["Munkabér", "Vállalkozói jövedelem", "Bérleti díjak", "Támogatások", "Passzív jövedelem", "Egyéb"]
  currentEditingId: string | null = null;
  private incomePieChart: Chart | null = null;
  incomes: any[] = [];
  currentPage: number = 1;
  pageSize: number = 5;

  constructor(private fb: FormBuilder,
    private message: NzMessageService,
    private router: Router,
    private firestore: Firestore,
    private fireauth: AngularFireAuth
    ) {}


    ngOnInit(): void {
      this.incomeForm = this.fb.group({
        title: [null, Validators.required],
        amount: [null, Validators.required],
        date: [null, Validators.required],
        category: [null, Validators.required],
        description: [null]
      });
      this.getAllIncomes();
    }

    get paginatedIncomes() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.incomes.slice(start, start + this.pageSize);
    }

    submitForm(): void {
      if (this.incomeForm.valid) {
        const data = this.incomeForm.value;
  
        if (this.currentEditingId) {
          const docRef = doc(this.firestore, `incomes/${this.currentEditingId}`);
          updateDoc(docRef, data)
            .then(() => {
              this.message.success("Bevétel frissítve!");
              this.incomeForm.reset();
              this.currentEditingId = null;
              this.getAllIncomes();
            })
            .catch((error) => {
              console.error(error);
              this.message.error("Hiba a frissítéskor.");
            });
        } else {
          this.fireauth.currentUser.then(user => {
            if (!user) {
              this.message.error("Nem vagy bejelentkezve.");
              return;
            }
    
            const ref = collection(this.firestore, 'incomes');
            const dataWithUserId = { ...data, userId: user.uid };
    
            addDoc(ref, dataWithUserId)
              .then(() => {
                this.message.success("Bevétel rögzítve!");
                this.incomeForm.reset();
                this.getAllIncomes();
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
  
    getAllIncomes(): void {
      this.fireauth.currentUser.then(user => {
        if (!user) return;
    
        const ref = collection(this.firestore, 'incomes');
        const userQuery = query(ref, where('userId', '==', user.uid));
    
        this.incomes$ = collectionData(userQuery, { idField: 'id' });
    
        this.incomes$.subscribe(data => {
          this.incomes = data;
          this.createIncomePieChart();
        });
      });
    }
  
    deleteIncome(id: string): void {
      const incomeDocRef = doc(this.firestore, `incomes/${id}`);
      deleteDoc(incomeDocRef)
        .then(() => {
          this.message.success("Bevétel törölve!");
          this.getAllIncomes();
        })
        .catch((error) => {
          console.error(error);
          this.message.error("Hiba történt a törlés közben.");
        });
    }
  
    editIncome(income: any): void {
      this.incomeForm.patchValue({
        title: income.title,
        amount: income.amount,
        date: income.date.toDate(),
        category: income.category,
        description: income.description
      });
      this.currentEditingId = income.id;
    }

    @ViewChild('incomePieChartRef') private incomePieChartRef: ElementRef;
    createIncomePieChart() {
      const ctx = this.incomePieChartRef.nativeElement.getContext('2d');
    
      const categoryMap: { [key: string]: number } = {};
    
      this.incomes.forEach(income => {
        const category = income.category || 'Egyéb';
        const amount = Number(income.amount) || 0;
        categoryMap[category] = (categoryMap[category] || 0) + amount;
      });
    
      const labels = Object.keys(categoryMap);
      const data = Object.values(categoryMap);
    
      if (this.incomePieChart) {
        this.incomePieChart.destroy();
      }
    
      this.incomePieChart = new Chart(ctx, {
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