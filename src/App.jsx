import { useState, useEffect, useRef, useMemo } from 'react'
import {
  WiHumidity, WiStrongWind, WiThermometer, WiBarometer,
  WiDaySunny, WiDayCloudy, WiCloud, WiRain, WiSnow, WiThunderstorm, WiFog,
  WiSunrise, WiSunset, WiTime3, WiRaindrop, WiWindDeg, WiCloudy,
  WiNightAltCloudy, WiNightAltRain, WiNightAltSnow, WiNightAltThunderstorm,
  WiDayFog, WiNightFog
} from 'react-icons/wi'
import { FiMapPin, FiCalendar, FiChevronDown, FiSearch, FiMoon, FiArrowUp, FiDroplet, FiNavigation, FiClock } from 'react-icons/fi'
import { BiLoaderAlt } from 'react-icons/bi'
import { MdAir } from 'react-icons/md'

import { TURKEY_DATA } from './cities'

function App() {
  const cityKeys = useMemo(() => Object.keys(TURKEY_DATA).sort(), []);

  const [menuCity, setMenuCity] = useState(null)
  const [menuDistrict, setMenuDistrict] = useState(null)
  const [displayCity, setDisplayCity] = useState(null)
  const [displayDistrict, setDisplayDistrict] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // localStorage'dan tema tercihini oku, yoksa varsayılan koyu tema
    const savedTheme = localStorage.getItem('skypulse-theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    // Sistem tercihine bak
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [lastRequest, setLastRequest] = useState({ url: null, lat: null, lon: null, calls: 0 })

  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);

  const [greeting, setGreeting] = useState("Merhaba");
  const [perfMetrics, setPerfMetrics] = useState({ fcp: null, lcp: null, cls: 0, tti: null })
  const [expandedDayIndex, setExpandedDayIndex] = useState(null)

  const cityButtonRef = useRef(null);
  const districtButtonRef = useRef(null);
  const hourlyRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Günaydın");
    else if (hour >= 12 && hour < 18) setGreeting("Tünaydın");
    else if (hour >= 18 && hour < 22) setGreeting("İyi Akşamlar");
    else setGreeting("İyi Geceler");

    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        e.stopPropagation();
        if (cityButtonRef.current) {
          cityButtonRef.current.focus();
          setIsCityOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Tema değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('skypulse-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchWeather = async (lat, lon, city, district) => {
    if (!lat || !lon) return;
    setLoading(true);
    setErrorMessage("")
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const forceFail = urlParams.get('failApi') === '1' || import.meta.env.VITE_FORCE_API_FAIL === '1'
      if (forceFail) throw new Error('Simulated API failure')
      const reqUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover&hourly=temperature_2m,weather_code,is_day,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=7`
      const response = await fetch(reqUrl);
      const data = await response.json();
      if (!response.ok) throw new Error("API'den geçersiz yanıt alındı.");

      setWeather(data);
      setDisplayCity(city);
      setDisplayDistrict(district);
      setLastRequest(prev => ({ url: reqUrl, lat, lon, calls: (prev.calls || 0) + 1 }))

    } catch (error) {
      console.error("Fetch Hatası:", error);
      setErrorMessage("Veri alınırken bir sorun oluştu.");
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    try {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((e) => {
          if (e.name === 'first-contentful-paint') {
            setPerfMetrics((m) => ({ ...m, fcp: Math.round(e.startTime) }))
          }
        })
      })
      paintObserver.observe({ type: 'paint', buffered: true })
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value
        }
        setPerfMetrics((m) => ({ ...m, cls: Number(clsValue.toFixed(3)) }))
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) setPerfMetrics((m) => ({ ...m, lcp: Math.round(last.startTime) }))
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      setTimeout(() => {
        setPerfMetrics((m) => ({ ...m, tti: Math.round(performance.now()) }))
      }, 1500)
    } catch { }
  }, [])

  // Auto-scroll to current hour when weather data loads
  useEffect(() => {
    if (weather && hourlyRef.current) {
      const currentHourElement = document.getElementById('current-hour');
      if (currentHourElement) {
        setTimeout(() => {
          // Use scrollIntoView to properly align the current hour at the left edge
          currentHourElement.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' });
        }, 150);
      }
    }
  }, [weather]);

  const handleCityChange = (newCity) => {
    setMenuCity(newCity);
    setMenuDistrict(null);
    setIsCityOpen(false);

    setTimeout(() => {
      setIsDistrictOpen(true);
      if (districtButtonRef.current) {
        districtButtonRef.current.focus();
      }
    }, 100);
  };

  const handleDistrictChange = (distName) => {
    if (!menuCity) return;
    const districtData = TURKEY_DATA[menuCity].find(d => d.name === distName);

    if (districtData) {
      setMenuDistrict(districtData);
      setIsDistrictOpen(false);
      fetchWeather(districtData.lat, districtData.lon, menuCity, districtData);
    }
  };

  // --- GÜNCELLENMİŞ İKON MANTIĞI (SİS EKLENDİ) ---
  const getWeatherIcon = (code, size = "text-4xl", isDay = 1) => {
    const wiScale = "scale-125";

    // GECE MODU
    if (isDay === 0) {
      if (code === 0) return <FiMoon className={`${size} text-blue-200`} />
      if ([1, 2, 3].includes(code)) return <WiNightAltCloudy className={`${size} ${wiScale} text-blue-200`} />

      // YENİ: Gece Sisi (Aylı Sis)
      if ([45, 48].includes(code)) return <WiNightFog className={`${size} ${wiScale} text-gray-400`} />

      if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <WiNightAltRain className={`${size} ${wiScale} text-blue-400`} />
      if ([71, 73, 75, 85, 86].includes(code)) return <WiNightAltSnow className={`${size} ${wiScale} text-white`} />
      if ([95, 96, 99].includes(code)) return <WiNightAltThunderstorm className={`${size} ${wiScale} text-purple-400`} />
      return <FiMoon className={`${size} text-blue-200`} />
    }

    // GÜNDÜZ MODU - Renkler hem açık hem koyu temada görünür olacak şekilde ayarlandı
    if (code === 0) return <WiDaySunny className={`${size} ${wiScale} text-yellow-400`} />
    if ([1, 2].includes(code)) return <WiDayCloudy className={`${size} ${wiScale} ${isDarkMode ? 'text-blue-100' : 'text-slate-500'}`} />
    if (code === 3) return <WiCloud className={`${size} ${wiScale} ${isDarkMode ? 'text-blue-200' : 'text-slate-400'}`} />

    // Gündüz Sisi
    if ([45, 48].includes(code)) return <WiDayFog className={`${size} ${wiScale} ${isDarkMode ? 'text-gray-400' : 'text-slate-400'}`} />

    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <WiRain className={`${size} ${wiScale} text-blue-400`} />
    if ([71, 73, 75, 85, 86].includes(code)) return <WiSnow className={`${size} ${wiScale} ${isDarkMode ? 'text-white' : 'text-blue-300'}`} />
    if ([95, 96, 99].includes(code)) return <WiThunderstorm className={`${size} ${wiScale} text-purple-400`} />
    return <WiDaySunny className={`${size} ${wiScale} text-gray-400`} />
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })
  }

  // Rüzgar yönü dereceyi yön metnine çevirir
  const getWindDirection = (degrees) => {
    if (degrees === undefined || degrees === null) return '-';
    const directions = ['Kuzey', 'K.Doğu', 'Doğu', 'G.Doğu', 'Güney', 'G.Batı', 'Batı', 'K.Batı'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  // Gün uzunluğunu hesaplar
  const getDayLength = (sunrise, sunset) => {
    const start = new Date(sunrise);
    const end = new Date(sunset);
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}s ${minutes}dk`;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'} p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white flex flex-col relative overflow-hidden transition-colors duration-300`}>
      <div className={`fixed top-[-20%] left-[-10%] w-[500px] h-[500px] ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-400/20'} rounded-full blur-[120px] pointer-events-none z-0`}></div>
      <div className={`fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-400/20'} rounded-full blur-[120px] pointer-events-none z-0`}></div>

      <div className="max-w-7xl mx-auto relative z-10 w-full flex-grow flex flex-col">

        {errorMessage && (
          <div role="alert" data-testid="error-banner" className="mb-4 px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg">
            {errorMessage}
          </div>
        )}
        <header className="flex flex-col items-center gap-4 mb-8">
          <div className="text-center md:text-left w-full">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center justify-center md:justify-start gap-2">
              <WiDaySunny className="text-blue-500" size={36} />
              SkyPulse <span className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-light text-sm hidden md:inline tracking-normal ml-2`}>| Anlık Hava. Akıllı Kararlar.</span>
            </h1>
            <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-600'} text-xs md:text-sm mt-1`}>Bugün, {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-2 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-lg'} p-2 rounded-2xl z-50 w-full md:w-auto`}>
            <CustomDropdown
              triggerRef={cityButtonRef}
              options={cityKeys}
              selected={menuCity}
              onChange={handleCityChange}
              icon={FiMapPin}
              searchable={true}
              placeholder="İl Seçin"
              side="left"
              forceOpen={isCityOpen}
              setForceOpen={setIsCityOpen}
              shortcutHint="Ctrl + ."
              isDarkMode={isDarkMode}
            />
            <div className={`hidden md:block w-[1px] h-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            <CustomDropdown
              options={menuCity ? TURKEY_DATA[menuCity].map(d => d.name).sort() : []}
              selected={menuDistrict?.name}
              onChange={handleDistrictChange}
              searchable={true}
              placeholder={menuCity ? "İlçe Seçin" : "Önce İl Seçin"}
              side="right"
              forceOpen={isDistrictOpen}
              setForceOpen={setIsDistrictOpen}
              triggerRef={districtButtonRef}
              isDarkMode={isDarkMode}
            />
            <button
              type="button"
              onClick={() => setIsDarkMode(prev => !prev)}
              className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-white/10 hover:bg-white/20 border-white/10' : 'bg-slate-100 hover:bg-slate-200 border-slate-200'} border transition-colors`}
              data-testid="dark-mode-toggle"
              aria-label="Tema Değiştir"
            >
              <FiMoon className={`text-lg ${isDarkMode ? '' : 'text-slate-600'}`} />
            </button>
          </div>
        </header>

        {loading && (
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950/50' : 'bg-white/70'} z-40 flex items-center justify-center backdrop-blur-sm rounded-3xl`} aria-busy="true">
            <BiLoaderAlt className="animate-spin text-5xl text-blue-500" data-testid="loading-spinner" />
          </div>
        )}

        {weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-blue-900/20 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-8" data-testid="current-weather-card">
                  <div>
                    <div className="flex items-center gap-2 text-blue-200 mb-2">
                      <FiMapPin />
                      <span className="font-semibold text-sm tracking-wide opacity-90">{displayCity}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-3 pb-1">
                      {displayDistrict?.name}
                    </h2>
                    <p className="text-lg text-white font-medium flex items-center gap-3">
                      <span className="text-2xl font-bold">{Math.round(weather.current.temperature_2m)}°</span>
                      <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                      <span>Hissedilen {Math.round(weather.current.apparent_temperature)}°</span>
                    </p>
                    <div className="text-xs text-white/70 mt-2" data-testid="coords">Koordinat: {displayDistrict?.lat}, {displayDistrict?.lon}</div>
                  </div>
                  <div className="text-center md:text-right">
                    {getWeatherIcon(weather.current.weather_code, "text-8xl", weather.current.is_day)}
                    <p className="text-base font-medium mt-2 text-blue-100/80">Güncel Durum</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-12">
                  <StatPill icon={WiHumidity} label="Nem" value={`%${weather.current.relative_humidity_2m}`} />
                  <StatPill icon={WiStrongWind} label="Rüzgar" value={`${weather.current.wind_speed_10m} km/s`} />
                  <StatPill icon={FiNavigation} label="Yön" value={getWindDirection(weather.current.wind_direction_10m)} />
                  <StatPill icon={WiRaindrop} label="Yağış İht." value={`%${weather.daily.precipitation_probability_max?.[0] ?? 0}`} />
                  <StatPill icon={WiCloudy} label="Bulutluluk" value={`%${weather.current.cloud_cover ?? 0}`} />
                  <StatPill icon={MdAir} label="UV İndeks" value={weather.daily.uv_index_max[0]} />
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-md'} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <WiTime3 className="text-2xl" /> Saatlik Tahmin
                </h3>
                <div tabIndex={-1} ref={hourlyRef} className={`flex overflow-x-scroll whitespace-nowrap scroll-smooth gap-4 pb-4 outline-none focus:outline-none ${isDarkMode ? 'scrollbar-custom' : 'scrollbar-custom-light'}`} data-testid="hourly-forecast">
                  {weather.hourly.time.slice(0, 24).map((time, index) => {
                    const hour = new Date(time).getHours();
                    const now = new Date().getHours();
                    const isCurrentHour = hour === now;
                    const isPastHour = hour < now;
                    const precipProb = weather.hourly.precipitation_probability?.[index] ?? 0;
                    return (
                      <div
                        key={index}
                        id={isCurrentHour ? 'current-hour' : undefined}
                        className={`min-w-[90px] flex flex-col items-center p-3 rounded-2xl border flex-shrink-0 transition-all
                          ${isCurrentHour ? 'bg-blue-600 border-blue-500 text-white' : ''}
                          ${isPastHour && !isCurrentHour ? (isDarkMode ? 'bg-white/5 border-white/5 opacity-50' : 'bg-slate-100 border-slate-200 opacity-50') : ''}
                          ${!isPastHour && !isCurrentHour ? (isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100') : ''}
                        `}
                        data-testid={`hour-${hour}`}
                        aria-current={isCurrentHour ? 'true' : 'false'}
                      >
                        <span className={`text-xs mb-1 ${isCurrentHour ? 'opacity-90 font-semibold' : 'opacity-70'}`}>
                          {isCurrentHour ? 'Şimdi' : `${hour.toString().padStart(2, '0')}:00`}
                        </span>
                        {getWeatherIcon(weather.hourly.weather_code[index], "text-2xl mb-1", weather.hourly.is_day[index])}
                        <span className="font-bold text-lg">{Math.round(weather.hourly.temperature_2m[index])}°</span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] ${isCurrentHour ? 'text-blue-200' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          <WiRaindrop className="text-sm" />
                          <span>%{precipProb}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-3">
                  <button type="button" data-testid="scroll-prev" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-gradient-to-r from-blue-600/30 to-blue-500/20 hover:from-blue-600/50 hover:to-blue-500/30 text-white border-blue-500/30' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-400'} border rounded-xl transition-all shadow-sm hover:shadow-md`} onClick={() => { if (hourlyRef.current) hourlyRef.current.scrollBy({ left: -200, behavior: 'smooth' }) }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Önceki
                  </button>
                  <button type="button" data-testid="scroll-next" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${isDarkMode ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/30 hover:from-blue-500/30 hover:to-blue-600/50 text-white border-blue-500/30' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-400'} border rounded-xl transition-all shadow-sm hover:shadow-md`} onClick={() => { if (hourlyRef.current) hourlyRef.current.scrollBy({ left: 200, behavior: 'smooth' }) }}>
                    Sonraki
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-md'} border rounded-3xl p-6 h-fit`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FiCalendar /> 7 Günlük Tahmin
                </h3>
                <div className="space-y-1">
                  {weather.daily.time.map((day, idx) => (
                    <div key={idx} className="cursor-pointer" onClick={() => setExpandedDayIndex(expandedDayIndex === idx ? null : idx)}>
                      <div className={`flex items-center justify-between p-3 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'} rounded-xl transition-colors group`}>
                        <span className={`w-16 text-sm font-medium ${isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'} transition-colors`}>{idx === 0 ? 'Bugün' : formatDate(day)}</span>
                        <div className="flex items-center gap-3">
                          {/* Yağış ihtimali badge */}
                          {weather.daily.precipitation_probability_max?.[idx] > 0 && (
                            <div className={`flex items-center gap-0.5 text-[10px] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              <WiRaindrop className="text-base" />
                              <span>%{weather.daily.precipitation_probability_max[idx]}</span>
                            </div>
                          )}
                          {getWeatherIcon(weather.daily.weather_code[idx], "text-2xl")}
                          <div className="flex gap-2 text-sm w-20 justify-end">
                            <span className="font-bold">{Math.round(weather.daily.temperature_2m_max[idx])}°</span>
                            <span className="opacity-50">{Math.round(weather.daily.temperature_2m_min[idx])}°</span>
                          </div>
                        </div>
                      </div>
                      {expandedDayIndex === idx && (
                        <div className={`mx-3 mb-2 p-4 rounded-xl ${isDarkMode ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'} text-xs`} data-testid={`day-detail-${idx}`}>
                          {/* İlk satır: Yağış ve Rüzgar */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <WiRaindrop className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                              <div>
                                <div className="opacity-60 text-[10px]">Yağış İhtimali</div>
                                <div className="font-semibold">%{weather.daily.precipitation_probability_max?.[idx] ?? 0}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <WiRain className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                              <div>
                                <div className="opacity-60 text-[10px]">Toplam Yağış</div>
                                <div className="font-semibold">{weather.daily.precipitation_sum?.[idx] ?? 0} mm</div>
                              </div>
                            </div>
                          </div>
                          {/* İkinci satır: Rüzgar ve UV */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <WiStrongWind className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                              <div>
                                <div className="opacity-60 text-[10px]">Max Rüzgar</div>
                                <div className="font-semibold">{getWindDirection(weather.daily.wind_direction_10m_dominant?.[idx])} {weather.daily.wind_speed_10m_max?.[idx] ?? 0} km/s</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MdAir className={`text-lg ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                              <div>
                                <div className="opacity-60 text-[10px]">UV İndeks</div>
                                <div className="font-semibold">{weather.daily.uv_index_max[idx]}</div>
                              </div>
                            </div>
                          </div>
                          {/* Üçüncü satır: Güneş bilgileri */}
                          <div className={`flex items-center justify-between pt-2 border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                            <span className="flex items-center gap-1">
                              <WiSunrise className="text-lg text-orange-400" />
                              {new Date(weather.daily.sunrise[idx]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1 opacity-60">
                              <FiClock className="text-sm" />
                              {getDayLength(weather.daily.sunrise[idx], weather.daily.sunset[idx])}
                            </span>
                            <span className="flex items-center gap-1">
                              <WiSunset className="text-lg text-purple-400" />
                              {new Date(weather.daily.sunset[idx]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-orange-500/20 to-purple-500/20 border-white/10' : 'bg-gradient-to-br from-orange-100 to-purple-100 border-slate-200 shadow-md'} border rounded-3xl p-6`} data-testid="sun-card">
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} mb-4 uppercase tracking-wider`}>Güneş Durumu</h3>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                    <WiSunrise className="text-4xl text-orange-400 mb-1" />
                    <span className="text-xs opacity-60">Doğum</span>
                    <span className="font-bold text-lg" data-testid="sunrise-time">{new Date(weather.daily.sunrise[0]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`h-10 w-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-slate-300'}`}></div>
                  <div className="flex flex-col items-center">
                    <WiSunset className="text-4xl text-purple-400 mb-1" />
                    <span className="text-xs opacity-60">Batım</span>
                    <span className="font-bold text-lg" data-testid="sunset-time">{new Date(weather.daily.sunset[0]).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[65vh] text-center space-y-8 animate-fade-in relative z-10">
            <div className="relative group cursor-default">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className={`relative ${isDarkMode ? 'bg-white/5 border-white/10 ring-white/5' : 'bg-blue-50 border-blue-200 ring-blue-100'} p-8 rounded-full border backdrop-blur-sm ring-1`}>
                <FiMapPin className="text-6xl text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
              </div>
            </div>

            <div className="max-w-xl space-y-3">
              <h2 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} tracking-tight`} data-testid="greeting">
                {greeting}, SkyPulse.
              </h2>
              <p className={`text-xl ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} font-light`}>
                Gökyüzünün nabzını tutmaya hazır mısın?
              </p>

              <div
                onClick={() => {
                  if (cityButtonRef.current) {
                    cityButtonRef.current.focus();
                    setIsCityOpen(true);
                  }
                }}
                className="pt-10 flex flex-col items-center gap-3 cursor-pointer group transition-all hover:scale-105"
              >
                <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-blue-300 group-hover:text-blue-200' : 'text-blue-600 group-hover:text-blue-500'} uppercase tracking-[0.2em] font-semibold transition-colors`}>
                  {menuCity
                    ? `${menuCity} SEÇİLDİ, İLÇE SEÇİN`
                    : "BAŞLAMAK İÇİN İL SEÇİMİ YAPIN"
                  }
                  {!menuCity && <span className={`hidden md:inline-block px-1.5 py-0.5 ${isDarkMode ? 'bg-white/10 text-slate-400 border-white/5' : 'bg-blue-100 text-blue-600 border-blue-200'} rounded text-[10px] group-hover:text-white transition-colors border`}>CTRL + .</span>}
                </div>
                <FiArrowUp className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-xl group-hover:text-blue-400 transition-colors`} />
              </div>
            </div>
          </div>
        )}
        <div className={`mt-10 text-center border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'} pt-6`}>
          <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-600'} text-sm font-mono`}>DEVELOPED BY ONUR KESKIN © 2025</p>
          <div className={`mt-3 text-xs ${isDarkMode ? 'opacity-60' : 'opacity-50 text-slate-500'}`} data-testid="perf-metrics">FCP:{perfMetrics.fcp ?? 'NA'}ms • LCP:{perfMetrics.lcp ?? 'NA'}ms • CLS:{perfMetrics.cls} • TTI:{perfMetrics.tti ?? 'NA'}ms</div>
          <div className={`mt-1 text-xs ${isDarkMode ? 'opacity-60' : 'opacity-50 text-slate-500'}`} data-testid="net-debug">Calls:{lastRequest.calls} • Lat:{lastRequest.lat ?? 'NA'} • Lon:{lastRequest.lon ?? 'NA'}</div>
        </div>
      </div>
      <style>{`
        .scrollbar-custom::-webkit-scrollbar { height: 6px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        .scrollbar-custom-light::-webkit-scrollbar { height: 6px; }
        .scrollbar-custom-light::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .scrollbar-custom-light::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        .scrollbar-custom-light::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  )
}

function CustomDropdown({ options, selected, onChange, icon: Icon, searchable = false, placeholder = "Ara...", side = 'left', forceOpen = false, setForceOpen = null, triggerRef = null, shortcutHint = null, isDarkMode = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm("")
        setFocusedIndex(-1)
        if (setForceOpen) setForceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setForceOpen])

  useEffect(() => {
    if (isOpen) {
      if (searchable && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 10);
      }
      setFocusedIndex(-1)
    }
  }, [isOpen, searchable])

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))
    );
  }, [options, searchTerm]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          onChange(filteredOptions[focusedIndex]);
          setIsOpen(false);
          setSearchTerm("");
          if (setForceOpen) setForceOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        if (setForceOpen) setForceOpen(false);
        if (triggerRef && triggerRef.current) triggerRef.current.focus();
        else if (dropdownRef.current && dropdownRef.current.querySelector('button')) dropdownRef.current.querySelector('button').focus();
        break;
      case 'Tab':
        setIsOpen(false);
        if (setForceOpen) setForceOpen(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex];
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const positionClass = side === 'right' ? 'right-0' : 'left-0';
  const listboxId = side === 'right' ? 'district-listbox' : 'province-listbox';

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          if (setForceOpen) setForceOpen(newState);
        }}
        tabIndex={0}
        className={`flex items-center gap-1.5 bg-transparent text-sm ${isDarkMode ? 'text-white hover:bg-white/10 focus:bg-white/10' : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100'} px-3 py-2 rounded-xl focus:ring-1 focus:ring-blue-500 transition-colors outline-none min-w-[120px] md:min-w-[140px] justify-between border border-transparent group`}
        data-testid={side === 'left' ? 'province-dropdown-trigger' : 'district-dropdown-trigger'}
        aria-expanded={isOpen}
        aria-controls={listboxId}
      >
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />}
          <span className="truncate max-w-[70px] md:max-w-[90px] text-xs md:text-sm">{selected || placeholder}</span>
        </div>
        <div className="flex items-center gap-2">
          {shortcutHint && !selected && (
            <span className={`hidden md:block text-[10px] ${isDarkMode ? 'text-slate-500 border-white/10 bg-white/5 group-hover:bg-white/10' : 'text-slate-500 border-slate-200 bg-slate-100 group-hover:bg-slate-200'} border px-1.5 rounded group-hover:text-slate-400 transition-colors`}>
              {shortcutHint}
            </span>
          )}
          <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className={`absolute top-full ${positionClass} mt-2 w-64 ${isDarkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'} border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in ring-1 ring-black/5`}>
          {searchable && (
            <div className={`p-2 sticky top-0 ${isDarkMode ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'} border-b z-10`}>
              <div className="relative">
                <FiSearch className={`absolute left-3 top-2.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-xs`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholder}
                  className={`w-full ${isDarkMode ? 'bg-white/5 text-white focus:bg-white/10 placeholder:text-slate-500' : 'bg-slate-100 text-slate-800 focus:bg-slate-50 placeholder:text-slate-400'} text-sm pl-8 pr-3 py-2 rounded-lg outline-none transition-colors`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  name="dropdown-search"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          <div id={listboxId} ref={listRef} className={`max-h-60 overflow-y-auto ${isDarkMode ? 'scrollbar-custom' : 'scrollbar-custom-light'} py-1`} role="listbox" data-testid={side === 'left' ? 'province-options' : 'district-options'}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  onClick={() => {
                    onChange(option)
                    setIsOpen(false)
                    setSearchTerm("")
                    if (setForceOpen) setForceOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                    ${selected === option ? 'bg-blue-600 text-white' : ''}
                    ${focusedIndex === index && selected !== option ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800') : ''}
                    ${selected !== option && focusedIndex !== index ? (isDarkMode ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800') : ''}
                  `}
                  role="option"
                  aria-selected={selected === option}
                >
                  {option}
                  {selected === option && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              ))
            ) : (
              <div className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-center`}>Sonuç bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-black/20 p-3 rounded-xl flex items-center gap-3 backdrop-blur-sm border border-white/5">
      <div className="p-2 bg-white/10 rounded-lg text-white">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] text-blue-200 uppercase tracking-wider font-bold opacity-80">{label}</p>
        <p className="font-bold text-lg leading-none text-white">{value}</p>
      </div>
    </div>
  )
}

export default App
