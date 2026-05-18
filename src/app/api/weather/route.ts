import { NextResponse } from 'next/server'

const KEY = process.env.OPENWEATHER_API_KEY

type OWMResponse = {
  main: { temp: number; feels_like: number; humidity: number }
  weather: Array<{ description: string; icon: string }>
  wind: { speed: number }
}

async function fetchCity(city: string): Promise<{ temp: number; description: string; icon: string } | null> {
  if (!KEY) return null
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${KEY}&units=imperial`,
      { next: { revalidate: 600 } }
    )
    if (!res.ok) return null
    const data = await res.json() as OWMResponse
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    }
  } catch {
    return null
  }
}

export async function GET() {
  if (!KEY) return NextResponse.json({ configured: false })

  const [teo, noelle] = await Promise.all([
    fetchCity('Erie,US,PA'),
    fetchCity('San Diego,US,CA'),
  ])

  return NextResponse.json({ configured: true, teo, noelle })
}
