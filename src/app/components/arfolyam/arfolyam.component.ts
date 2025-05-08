import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { debounceTime } from 'rxjs/operators';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-exchange',
  templateUrl: './arfolyam.component.html',
  styleUrls: ['./arfolyam.component.scss']
})
export class ArfolyamComponent implements OnInit {
  exchangeForm!: FormGroup;
  conversionResult: number | null = null;
  currencyCodes: string[] = ['EUR', 'USD', 'HUF', 'GBP', 'CHF'];
  activeTab = 'rates';
  tabList = [
    { key: 'rates', tab: 'Árfolyamok' },
    { key: 'converter', tab: 'Váltó' }
  ];

  baseCurrency: string = 'HUF';
  latestRates: any = null;
  selectedTabIndex = 0;
  graphFrom = this.getDefaultFromCurrency();
  graphTo = this.getDefaultToCurrency();
  errorMessage: string | null = null;
  rateChanges: { [code: string]: 'up' | 'down' | 'same' } = {};
  selectedRange: '7d' | '30d' | '90d' | '1y' = '30d';
  news: any[]= [];
  isLoadingNews = true;
  visibleCount = 5;

  constructor(private fb: FormBuilder, private http: HttpClient, private newsService: NewsService) {}

  ngOnInit(): void {
    this.exchangeForm = this.fb.group({
      amount: [1, Validators.required],
      from: [this.getDefaultFromCurrency(), Validators.required],
      to: [this.getDefaultToCurrency(), Validators.required]
    });
    this.newsService.getPortfolioNews().subscribe({
      next: items => {
        this.news = items;
        this.isLoadingNews = false;
      },
      error: () => {
        this.isLoadingNews = false;
      }
    });

    this.fetchLatestRatesForTable();
    this.loadHistoricalRates(this.graphFrom, this.graphTo);
    this.exchangeForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.convertCurrency();
    });
  }

  get visibleNews() {
    return this.news.slice(0, this.visibleCount);
  }

  showMoreNews(): void {
    this.visibleCount += 5;
  }

  getDefaultToCurrency(): string {
    return this.currencyCodes.includes('HUF') ? 'HUF' : this.currencyCodes[0];
  }
  
  getDefaultFromCurrency(): string {
    return this.currencyCodes.find(c => c !== this.getDefaultToCurrency()) || this.currencyCodes[0];
  }

  fetchLatestRatesForTable() {
    const targets = this.currencyCodes.filter(code => code !== this.baseCurrency).join(',');
  
    this.http.get(`https://api.frankfurter.app/latest?from=${this.baseCurrency}&to=${targets}`)
      .subscribe({
        next: (latest: any) => {
          this.latestRates = latest.rates;
  
          const yesterdayStr = this.getPreviousBusinessDayDateString();
  
          this.http.get(`https://api.frankfurter.app/${yesterdayStr}?from=${this.baseCurrency}&to=${targets}`)
            .subscribe({
              next: (previous: any) => {
                this.rateChanges = {};
                for (const code of Object.keys(this.latestRates)) {
                  const todayRate = +(1 / this.latestRates[code]).toFixed(4);
                  const prevRate = previous.rates?.[code] ? +(1 / previous.rates[code]).toFixed(4) : undefined;
                  if (prevRate !== undefined) {
                    if (todayRate > prevRate) {
                      this.rateChanges[code] = 'up';
                    } else if (todayRate < prevRate) {
                      this.rateChanges[code] = 'down'; 
                    } else {
                      this.rateChanges[code] = 'same';
                    }
                  }
                }
              },
        error: () => {
          this.errorMessage = 'Hiba történt az árfolyamok lekérésekor.';
        }
      });
  }
  });
}

  fetchHistoricalRatesForChart(base: string, target: string) {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
    const url = `https://api.frankfurter.app/${start}..${end}?from=${base}&to=${target}`;
    this.http.get(url).subscribe((res: any) => {
      const chartLabels = Object.keys(res.rates);
      const chartData = chartLabels.map(date => res.rates[date][target]);
      this.renderChart(chartLabels, chartData, `${base} → ${target}`);
    });
  }

  convertCurrency() {
    const { amount, from, to } = this.exchangeForm.value;
    if (!amount || !from || !to) return;
  
    if (from === to) {
      this.conversionResult = amount;
      return;
    }
  
    this.http.get(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`)
      .subscribe({
        next: (res: any) => {
          this.conversionResult = res.rates[to];
        },
        error: () => {
          this.errorMessage = 'Nem sikerült az átváltás.';
        }
      });
  }

  @ViewChild('chartRef') chartRef!: ElementRef;
  chart: Chart | null = null;

  renderChart(labels: string[], data: number[], label: string) {
    if (this.chart) {
      this.chart.destroy();
    }
  
    const ctx = this.chartRef.nativeElement.getContext('2d');
    const today = new Date().toISOString().split('T')[0];
  
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${label} (1 egység)`,
          data,
          borderColor: '#1890ff',
          backgroundColor: '#e6f7ff',
          fill: false,
          pointRadius: labels.map(l => l === today ? 6 : 3),
          pointBackgroundColor: labels.map(l => l === today ? '#ff4d4f' : '#1890ff'),
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: context => ` ${context.parsed.y.toFixed(2)} ${this.graphTo}`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Dátum' } },
          y: { title: { display: true, text: this.graphTo } }
        }
      }
    });
  }

loadHistoricalRates(base: string, target: string) {
  const endDateObj = new Date(); 
  const startDate = new Date();

  const ranges: { [key: string]: number } = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };

  startDate.setDate(endDateObj.getDate() - ranges[this.selectedRange]);
  const formattedStart = startDate.toISOString().split('T')[0];
  const formattedEnd = endDateObj.toISOString().split('T')[0];

  const url = `https://api.frankfurter.app/${formattedStart}..${formattedEnd}?from=${base}&to=${target}`;

  this.http.get(url).subscribe({
    next: (res: any) => {
      const dates = Object.keys(res.rates).sort();
      const data = dates.map(date => res.rates[date][target]);
      this.renderChart(dates, data, `${base} → ${target}`);
    },
    error: () => {
      this.errorMessage = 'Nem sikerült a grafikon adatait lekérni.';
    }
  });
}

  swapCurrencies() {
    const { from, to } = this.exchangeForm.value;

    this.exchangeForm.patchValue({ from: to, to: from });
    const temp = this.graphFrom;
    this.graphFrom = this.graphTo;
    this.graphTo = temp;
    this.convertCurrency();
    this.loadHistoricalRates(this.exchangeForm.value.from, this.exchangeForm.value.to);
  }

  getPreviousBusinessDayDateString(): string {
    const date = new Date();
    let tries = 0;
  
    while (tries < 5) {
      date.setDate(date.getDate() - 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) { 
        return date.toISOString().split('T')[0];
      }
      tries++;
    }
  
    return date.toISOString().split('T')[0];
  } 

}
