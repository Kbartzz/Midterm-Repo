import { Component } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import { Geolocation } from '@capacitor/geolocation';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage {
  weatherData: any;
  forecastData: any;
  hourlyData: any[] = [];
  city: string = 'Cebu';
  latitude: number | null = null;
  longitude: number | null = null;
  temperatureUnit: 'metric' | 'imperial' = 'metric';
  notificationsEnabled: boolean = false;
  isUsingCurrentLocation: boolean = true;
  isOffline: boolean = false;

  constructor(private weatherService: WeatherService) { }

  ngOnInit() {

    this.checkConnectivity();
    window.addEventListener('online', () => this.checkConnectivity());
    window.addEventListener('offline', () => this.checkConnectivity());
  }

  checkConnectivity() {
    this.isOffline = !navigator.onLine;

    if (this.isOffline) {
      this.loadCachedWeather();
    } else {
      this.getCurrentLocation();
    }
  }

  darkMode = localStorage.getItem('darkMode') === 'disable';

  toggleDarkMode() {
    const darkMode = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", darkMode ? "enabled" : "disabled");
    this.temperatureUnit = (localStorage.getItem('temperatureUnit') as any) || 'metric';
    this.notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';

    if (localStorage.getItem("darkMode") === "enabled") {
      document.body.classList.add("dark");
    }
  }

  toggleTemperatureUnit() {
    localStorage.setItem('temperatureUnit', this.temperatureUnit);

    if (this.isUsingCurrentLocation && this.latitude && this.longitude) {
      this.getWeatherByCoords();
      this.getWeatherForecastByCoords();
    } else {
      this.searchCity(this.city);
    }
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notificationsEnabled', this.notificationsEnabled.toString());

    if (this.notificationsEnabled) {
      console.log('Notifications enabled.');
    } else {
      console.log('Notifications disabled.');
    }
  }

  //Current Location
  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;

      localStorage.setItem('lastLatitude', this.latitude.toString());
      localStorage.setItem('lastLongitude', this.longitude.toString());

      this.isUsingCurrentLocation = true;

      console.log(`Latitude: ${this.latitude}, Longitude: ${this.longitude}`);

      this.getWeatherByCoords();
      this.getWeatherForecastByCoords();
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }

  // Weather by Coordinates
  getWeatherByCoords() {
    if (this.latitude !== null && this.longitude !== null) {
      this.weatherService.getWeatherByCoords(this.latitude!, this.longitude!, this.temperatureUnit).subscribe(
        data => {
          this.weatherData = data;
          this.saveCachedWeather(data);
        },
        error => {
          console.error('Error fetching weather:', error);
        }
      );
    }
  }

  // 5 day and hourly forecast
  getWeatherForecastByCoords() {
    if (this.latitude !== null && this.longitude !== null) {
      this.weatherService.getForecastByCoords(this.latitude, this.longitude, this.temperatureUnit).subscribe(
        data => {
          this.forecastData = data;

          const now = new Date();
          this.hourlyData = data.list.filter((item: any) => {
            const forecastTime = new Date(item.dt_txt + ' UTC');
            return forecastTime > now;
          }).slice(0, 8);

          console.log('Hourly Data (coords):', this.hourlyData);
        },
        error => {
          console.error('Error fetching forecast by coordinates:', error);
        }
      );
    }
  }

  // Weather by City Name
  searchCity(city: string) {
    this.city = city;
    this.isUsingCurrentLocation = false;

    this.weatherService.getWeather(this.city, this.temperatureUnit).subscribe(
      data => {
        this.weatherData = data;
        this.saveCachedWeather(data);
        console.log('Weather by City:', data);
      },
      error => {
        console.error('Error fetching weather by city:', error);
      }
    );

    this.weatherService.getWeatherForecast(this.city, this.temperatureUnit).subscribe(
      data => {
        this.forecastData = data;

        const now = new Date();
        this.hourlyData = data.list.filter((item: any) => {
          const forecastTime = new Date(item.dt_txt);
          return forecastTime > now;
        }).slice(0, 8);

        console.log('Upcoming Hourly Forecast:', this.hourlyData);
      },
      error => {
        console.error('Error fetching forecast:', error);
      }
    );

  }

  // Weather by city
  getWeatherByCity() {
    this.weatherService.getWeather(this.city, this.temperatureUnit).subscribe(
      data => {
        this.weatherData = data;
        this.saveCachedWeather(data);
        console.log('Weather for:', this.city, data);
      },
      error => {
        console.error('Error fetching weather:', error);
      }
    );

    this.weatherService.getWeatherForecast(this.city, this.temperatureUnit).subscribe(
      data => {
        this.forecastData = data;

        // hourly forecast
        const today = new Date().toISOString().split('T')[0];
        this.hourlyData = data.list.filter((item: any) => item.dt_txt.startsWith(today));

        console.log('Today\'s Hourly Data:', this.hourlyData);
      },
      error => {
        console.error('Error fetching forecast:', error);
      }
    );
  }
  onSearch(event: any) {
    const value = event?.target?.value;
    if (value && value.trim().length > 0) {
      this.searchCity(value.trim());
    }
    if (!value || value.trim().length === 0) {
      this.getCurrentLocation();
      return;
    }

    this.searchCity(value.trim());
  }

  loadCachedWeather() {
    if (!this.isOffline) return;

    const cachedWeather = localStorage.getItem('cachedWeatherData');
    const cachedLat = localStorage.getItem('lastLatitude');
    const cachedLon = localStorage.getItem('lastLongitude');

    console.log('Offline mode: Attempting to load cached weather...');
    console.log('cachedWeatherData:', cachedWeather);
    console.log('cachedLat:', cachedLat, 'cachedLon:', cachedLon);

    if (cachedLat && cachedLon) {
      this.latitude = parseFloat(cachedLat);
      this.longitude = parseFloat(cachedLon);
      this.isUsingCurrentLocation = true;
    }

    if (cachedWeather) {
      const parsed = JSON.parse(cachedWeather);
      this.weatherData = {
        name: parsed.name,
        main: {
          temp: parsed.temp
        },
        weather: [{
          description: parsed.description,
          icon: parsed.icon
        }]
      };
      this.city = parsed.name;
      this.temperatureUnit = parsed.unit || 'metric';

      console.log('Offline: Loaded cached current weather:', this.weatherData);
    } else {
      console.warn('Offline: No cached weather data found.');
    }
  }

  saveCachedWeather(data: any) {
    const minimal = {
      name: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      unit: this.temperatureUnit,
    };
    localStorage.setItem('cachedWeatherData', JSON.stringify(minimal));
  }



  // Iconz
  getWeatherIcon(weather: string): string {
    switch (weather.toLowerCase()) {
      case 'clear':
        return 'sunny-outline';
      case 'clouds':
        return 'cloud-outline';
      case 'rain':
        return 'rainy-outline';
      case 'snow':
        return 'snow-outline';
      case 'thunderstorm':
        return 'thunderstorm-outline';
      default:
        return 'partly-sunny-outline';
    }
  }

}
