export type WeatherCondition = 'RAIN' | 'SNOW' | 'WIND' | 'NONE';

export interface CurrentWeather {
  condition: WeatherCondition;
}
