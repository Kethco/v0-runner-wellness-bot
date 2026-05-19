"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudSun,
  MapPin,
  Settings,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DayForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  precipChance: number;
  windSpeed: number;
  condition: string;
  icon: string;
  isGoodForRunning: boolean;
}

interface WeatherData {
  location: string;
  forecast: DayForecast[];
  isDefaultLocation?: boolean;
}

const ICON_MAP: Record<string, typeof Sun> = {
  "sun": Sun,
  "cloud": Cloud,
  "cloud-sun": CloudSun,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-fog": CloudFog,
  "snowflake": CloudSnow,
  "cloud-lightning": CloudLightning,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeatherStrip() {
  const { data, error, isLoading } = useSWR<WeatherData>("/api/weather", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000 * 60 * 30, // Cache for 30 minutes
  });

  if (isLoading) {
    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse" />
          <div className="w-20 h-3 bg-white/20 rounded animate-pulse" />
        </div>
        <div className="flex justify-between">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-6 h-3 bg-white/10 rounded animate-pulse" />
              <div className="w-5 h-5 bg-white/10 rounded-full animate-pulse" />
              <div className="w-8 h-3 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.forecast || data.forecast.length === 0) {
    return null; // Silently fail - weather is nice to have, not critical
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-4 pt-4 border-t border-white/10"
    >
      {/* Location header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-[#FF6B00]" />
          <span className="text-xs text-white/50 font-medium">{data.location}</span>
        </div>
        {data.isDefaultLocation && (
          <Link 
            href="/profile" 
            className="flex items-center gap-1 text-[10px] text-[#FF6B00] hover:text-[#FF8C00] transition-colors"
          >
            <Settings className="w-3 h-3" />
            Set your location
          </Link>
        )}
      </div>

      {/* 7-day forecast strip */}
      <div className="flex justify-between">
        {data.forecast.map((day, i) => {
          const date = new Date(day.date + "T12:00:00");
          const dayName = i === 0 ? "Today" : DAY_NAMES[date.getDay()];
          const IconComponent = ICON_MAP[day.icon] || Cloud;
          
          // Color based on running conditions
          const iconColor = day.isGoodForRunning 
            ? "#30D158" // Green for good
            : day.precipChance > 70 
              ? "#FF453A" // Red for rain likely
              : "#FFD60A"; // Yellow for caution

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex flex-col items-center min-w-[38px]"
            >
              {/* Day name */}
              <span className={`text-[10px] font-semibold mb-1 ${
                i === 0 ? "text-[#FF6B00]" : "text-white/50"
              }`}>
                {dayName}
              </span>
              
              {/* Weather icon */}
              <div 
                className="w-6 h-6 flex items-center justify-center rounded-full mb-1"
                style={{ backgroundColor: `${iconColor}20` }}
              >
                <IconComponent 
                  className="w-3.5 h-3.5" 
                  style={{ color: iconColor }}
                />
              </div>
              
              {/* Temperature */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white leading-none">
                  {day.tempHigh}°
                </span>
                <span className="text-[10px] text-white/50 leading-none mt-0.5">
                  {day.tempLow}°
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Running condition note for today */}
      {data.forecast[0] && (
        <div className="mt-3 flex items-center gap-2">
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ 
              backgroundColor: data.forecast[0].isGoodForRunning 
                ? '#30D158' 
                : data.forecast[0].precipChance > 70 
                  ? '#FF453A' 
                  : '#FFD60A' 
            }}
          />
          <span className="text-[11px] text-white/60">
            {data.forecast[0].isGoodForRunning 
              ? "Great conditions for your run today"
              : data.forecast[0].precipChance > 70
                ? `${data.forecast[0].precipChance}% chance of rain — consider indoor options`
                : data.forecast[0].tempHigh > 85
                  ? "Hot day — hydrate well and run early"
                  : data.forecast[0].tempHigh < 40
                    ? "Cold day — layer up for your run"
                    : "Moderate conditions — check the wind"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
