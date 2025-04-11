import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = '749b6ec58bd2a551be3f151b9bf4b8a7';
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

  constructor(private http: HttpClient) {}

// 🌤 Current weather by city
getWeather(city: string, unit: string = 'metric', country: string = 'PH'): Observable<any> {
  const url = `${this.apiUrl}?q=${city},${country}&appid=${this.apiKey}&units=${unit}`;
  return this.http.get(url);
}

// 📅 Forecast by city
getWeatherForecast(city: string, unit: string = 'metric', country: string = 'PH'): Observable<any> {
  const url = `${this.forecastUrl}?q=${city},${country}&appid=${this.apiKey}&units=${unit}`;
  return this.http.get(url);
}

// 📍 Current weather by coordinates
getWeatherByCoords(lat: number, lon: number, unit: string = 'metric'): Observable<any> {
  const url = `${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${unit}`;
  return this.http.get(url);
}

// 📍 Forecast by coordinates ← ✅ Add this!
getForecastByCoords(lat: number, lon: number, unit: string = 'metric'): Observable<any> {
  const url = `${this.forecastUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${unit}`;
  return this.http.get(url);
}

  
}
