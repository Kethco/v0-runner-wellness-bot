import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Open-Meteo weather codes to descriptions
const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear", icon: "sun" },
  1: { label: "Mainly Clear", icon: "sun" },
  2: { label: "Partly Cloudy", icon: "cloud-sun" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "cloud-fog" },
  48: { label: "Fog", icon: "cloud-fog" },
  51: { label: "Light Drizzle", icon: "cloud-drizzle" },
  53: { label: "Drizzle", icon: "cloud-drizzle" },
  55: { label: "Heavy Drizzle", icon: "cloud-drizzle" },
  56: { label: "Freezing Drizzle", icon: "cloud-drizzle" },
  57: { label: "Freezing Drizzle", icon: "cloud-drizzle" },
  61: { label: "Light Rain", icon: "cloud-rain" },
  63: { label: "Rain", icon: "cloud-rain" },
  65: { label: "Heavy Rain", icon: "cloud-rain" },
  66: { label: "Freezing Rain", icon: "cloud-rain" },
  67: { label: "Freezing Rain", icon: "cloud-rain" },
  71: { label: "Light Snow", icon: "snowflake" },
  73: { label: "Snow", icon: "snowflake" },
  75: { label: "Heavy Snow", icon: "snowflake" },
  77: { label: "Snow Grains", icon: "snowflake" },
  80: { label: "Light Showers", icon: "cloud-rain" },
  81: { label: "Showers", icon: "cloud-rain" },
  82: { label: "Heavy Showers", icon: "cloud-rain" },
  85: { label: "Snow Showers", icon: "snowflake" },
  86: { label: "Snow Showers", icon: "snowflake" },
  95: { label: "Thunderstorm", icon: "cloud-lightning" },
  96: { label: "Thunderstorm", icon: "cloud-lightning" },
  99: { label: "Thunderstorm", icon: "cloud-lightning" },
};

// Geocoding: city name to coordinates
async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's location from profile - handle if column doesn't exist
  let location = "New York";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("location")
      .eq("id", user.id)
      .single();
    
    if (profile?.location) {
      location = profile.location;
    }
  } catch (e) {
    // Column might not exist yet, use default
    console.log("[v0] Could not fetch location, using default:", e);
  }
  
  // Geocode the location
  const coords = await geocodeCity(location);
  if (!coords) {
    // If geocoding fails, try with default NYC coordinates
    console.log("[v0] Geocoding failed for:", location);
    return NextResponse.json({
      location: "New York",
      forecast: [],
      error: "Location not found"
    });
  }

  // Fetch 7-day forecast from Open-Meteo
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`
    );
    
    if (!res.ok) {
      throw new Error("Weather API error");
    }

    const data = await res.json();
    
    // Transform the data
    const forecast = data.daily.time.map((date: string, i: number) => {
      const code = data.daily.weather_code[i];
      const weather = WEATHER_CODES[code] || { label: "Unknown", icon: "cloud" };
      
      return {
        date,
        tempHigh: Math.round(data.daily.temperature_2m_max[i]),
        tempLow: Math.round(data.daily.temperature_2m_min[i]),
        precipChance: data.daily.precipitation_probability_max[i],
        windSpeed: Math.round(data.daily.wind_speed_10m_max[i]),
        condition: weather.label,
        icon: weather.icon,
        // Running conditions assessment
        isGoodForRunning: code <= 3 && data.daily.precipitation_probability_max[i] < 50,
      };
    });

    return NextResponse.json({
      location: coords.name,
      forecast,
    });
  } catch (error) {
    console.error("Weather fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
