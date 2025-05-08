import { Component, ElementRef, OnInit, ViewChild, Injectable  } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {AuthService} from "../../shared/auth.service";
import { Auth } from '@angular/fire/auth';
import Chart from 'chart.js/auto';
import { CategoryScale } from 'chart.js/auto';
import {  Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { from, switchMap, firstValueFrom,} from 'rxjs';

Chart.register(CategoryScale);

interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: any;
  [key: string]: any;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit{

  stats: any = null;
  chartData: any[] = [];
  incomes: any[] = [];
  expenses: any[] = [];
  selectedCombinedRange: string = '30d';

  gridStyle = {
    width: '25%',
    textAlign: 'center'
  };

  constructor(
    private authService : AuthService,
    private firestore: Firestore,
    private fireauth: AngularFireAuth
  ) {}

  ngOnInit(): void {
    this.getStats().subscribe({
      next: (res) => {
        this.stats = res;
      },
      error: (err) => {
        console.error('❌ Hiba a statisztikák lekérésekor:', err);
      }
    });
    this.getChartData().subscribe({
      next: (data) => {
        this.chartData = data;
        this.incomes = data.filter(d => d.type === 'income');
        this.expenses = data.filter(d => d.type === 'expense');
        this.createCombinedChart();
      },
      error: (err) => {
        console.error('❌ Hiba a diagramadatok lekérésekor:', err);
      }
    });
  }

  @ViewChild('combinedChartRef') combinedChartRef!: ElementRef;
  combinedChart: Chart | null = null;

  createCombinedChart(): void {
    if (this.combinedChart) {
      this.combinedChart.destroy();
    }

    const now = new Date();
    const ranges: { [key: string]: number } = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = ranges[this.selectedCombinedRange] || 30;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);
  
    const filteredIncomes = this.incomes.filter(entry => {
      const d = entry.date.toDate?.() ?? new Date(entry.date);
      return d >= startDate;
    });
    const filteredExpenses = this.expenses.filter(entry => {
      const d = entry.date.toDate?.() ?? new Date(entry.date);
      return d >= startDate;
    });
  
    const allDatesSet = new Set<string>();
    [...filteredIncomes, ...filteredExpenses].forEach(entry => {
      const dateStr = (entry.date.toDate?.() ?? entry.date).toISOString().split('T')[0];
      allDatesSet.add(dateStr);
    });
  
    const allDates = Array.from(allDatesSet).sort();
  
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
  
    filteredIncomes.forEach(income => {
      const dateStr = (income.date.toDate?.() ?? income.date).toISOString().split('T')[0];
      incomeMap.set(dateStr, (incomeMap.get(dateStr) || 0) + income.amount);
    });
  
    filteredExpenses.forEach(expense => {
      const dateStr = (expense.date.toDate?.() ?? expense.date).toISOString().split('T')[0];
      expenseMap.set(dateStr, (expenseMap.get(dateStr) || 0) + expense.amount);
    });
  
    const incomeData = allDates.map(date => incomeMap.get(date) || 0);
    const expenseData = allDates.map(date => expenseMap.get(date) || 0);
  
    const ctx = this.combinedChartRef.nativeElement.getContext('2d');
  
    this.combinedChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allDates,
        datasets: [
          {
            label: 'Bevétel',
            data: incomeData,
            backgroundColor: 'rgba(0, 200, 0, 0.6)',
          },
          {
            label: 'Kiadás',
            data: expenseData,
            backgroundColor: 'rgba(255, 0, 0, 0.6)',
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: false
          },
          y: {
            beginAtZero: true,
            stacked: false,
            ticks: {
              callback: value => Number(value).toLocaleString() + ' Ft'
            },
            suggestedMax: Math.max(...incomeData, ...expenseData) * 1.1
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} Ft`
            }
          }
        }
      }
    });
  }


  logout(){
    this.authService.logout();
  }
  

 getStats() {
  return from(this.fireauth.currentUser).pipe(
    switchMap(user => {
      if (!user) throw new Error('Nincs bejelentkezett felhasználó');

      const incomeQuery = query(
        collection(this.firestore, 'incomes'),
        where('userId', '==', user.uid)
      );

      const expenseQuery = query(
        collection(this.firestore, 'expenses'),
        where('userId', '==', user.uid)
      );

      return Promise.all([
        firstValueFrom(collectionData(incomeQuery, { idField: 'id' })) as Promise<Transaction[]>,
        firstValueFrom(collectionData(expenseQuery, { idField: 'id' })) as Promise<Transaction[]>
      ]).then(([incomes, expenses]) => {
        const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
        const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const balance = totalIncome - totalExpense;

        const minIncome = incomes.length ? Math.min(...incomes.map(i => i.amount || 0)) : 0;
        const maxIncome = incomes.length ? Math.max(...incomes.map(i => i.amount || 0)) : 0;
        const minExpense = expenses.length ? Math.min(...expenses.map(e => e.amount || 0)) : 0;
        const maxExpense = expenses.length ? Math.max(...expenses.map(e => e.amount || 0)) : 0;

        const latestIncome = incomes.length ? incomes.sort((a, b) =>
          new Date(b.date.toDate?.() || b.date).getTime() - new Date(a.date.toDate?.() || a.date).getTime()
        )[0] : null;

        const latestExpense = expenses.length ? expenses.sort((a, b) =>
          new Date(b.date.toDate?.() || b.date).getTime() - new Date(a.date.toDate?.() || a.date).getTime()
        )[0] : null;

        return {
          totalIncome,
          totalExpense,
          balance,
          minIncome,
          maxIncome,
          minExpense,
          maxExpense,
          latestIncome,
          latestExpense
        };
      });
    })
  );
}

  getChartData() {
    return from(this.fireauth.currentUser).pipe(
      switchMap(user => {
        if (!user) throw new Error('Nincs bejelentkezett felhasználó');
  
        const incomeQuery = query(
          collection(this.firestore, 'incomes'),
          where('userId', '==', user.uid)
        );
  
        const expenseQuery = query(
          collection(this.firestore, 'expenses'),
          where('userId', '==', user.uid)
        );
  
        return Promise.all([
          firstValueFrom(collectionData(incomeQuery, { idField: 'id' })),
          firstValueFrom(collectionData(expenseQuery, { idField: 'id' }))
        ]).then(([incomes, expenses]) => {
          const taggedIncomes = incomes.map(i => ({ ...i, type: 'income' }));
          const taggedExpenses = expenses.map(e => ({ ...e, type: 'expense' }));
          return [...taggedIncomes, ...taggedExpenses];
        });
      })
    );
  }
}
