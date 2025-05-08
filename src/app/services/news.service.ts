import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  constructor(private http: HttpClient) {}

  getPortfolioNews(): Observable<any[]> {
    const rssUrl = 'https://www.portfolio.hu/rss/gazdasag.xml';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    return this.http.get<any>(apiUrl).pipe(map(res => res.items || []));
  }
}
