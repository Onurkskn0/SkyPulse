import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  WiHumidity, WiStrongWind, WiThermometer, WiBarometer, 
  WiDaySunny, WiDayCloudy, WiCloud, WiRain, WiSnow, WiThunderstorm, WiFog, 
  WiSunrise, WiSunset, WiTime3,
  WiNightAltCloudy, WiNightAltRain, WiNightAltSnow, WiNightAltThunderstorm,
  // YENİ EKLENEN SİS İKONLARI:
  WiDayFog, WiNightFog 
} from 'react-icons/wi'
import { FiMapPin, FiCalendar, FiChevronDown, FiSearch, FiMoon, FiArrowUp } from 'react-icons/fi'
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
  
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  
  const [greeting, setGreeting] = useState("Merhaba");
  
  const cityButtonRef = useRef(null);

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

  const fetchWeather = async (lat, lon, city, district) => {
    if (!lat || !lon) return; 
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`
      );
      const data = await response.json();
      if (!response.ok) throw new Error("API'den geçersiz yanıt alındı.");

      setWeather(data);
      setDisplayCity(city);        
      setDisplayDistrict(district); 

    } catch (error) {
      console.error("Fetch Hatası:", error);
      alert("Veri alınırken bir sorun oluştu."); 
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (newCity) => {
    setMenuCity(newCity);      
    setMenuDistrict(null);     
    setIsCityOpen(false); 
    
    setTimeout(() => {
       setIsDistrictOpen(true);
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

    // GÜNDÜZ MODU
    if (code === 0) return <WiDaySunny className={`${size} ${wiScale} text-yellow-400`} />
    if ([1, 2].includes(code)) return <WiDayCloudy className={`${size} ${wiScale} text-blue-100`} />
    if (code === 3) return <WiCloud className={`${size} ${wiScale} text-blue-200`} />
    
    // YENİ: Gündüz Sisi (Güneşli Sis)
    if ([45, 48].includes(code)) return <WiDayFog className={`${size} ${wiScale} text-gray-400`} />
    
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <WiRain className={`${size} ${wiScale} text-blue-400`} />
    if ([71, 73, 75, 85, 86].includes(code)) return <WiSnow className={`${size} ${wiScale} text-white`} />
    if ([95, 96, 99].includes(code)) return <WiThunderstorm className={`${size} ${wiScale} text-purple-400`} />
    return <WiDaySunny className={`${size} ${wiScale} text-gray-400`} />
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans selection:bg-blue-500 selection:text-white flex flex-col relative overflow-hidden">
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto relative z-10 w-full flex-grow flex flex-col">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <WiDaySunny className="text-blue-500" size={40}/> 
              SkyPulse <span className="text-slate-400 font-light text-sm hidden md:inline tracking-normal ml-2">| Anlık Hava. Akıllı Kararlar.</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-1">Bugün, {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year:'numeric' })}</p>
          </div>

          <div className="flex gap-3 bg-slate-900 p-1.5 rounded-2xl border border-white/10 z-50 shadow-xl">
            <CustomDropdown 
              triggerRef={cityButtonRef}
              options={cityKeys} 
              selected={menuCity} 
              onChange={handleCityChange}
              icon={FiMapPin}
              searchable={true}
              placeholder="İl Seçiniz..."
              side="left"
              forceOpen={isCityOpen} 
              setForceOpen={setIsCityOpen}
              shortcutHint="Ctrl + ."
            />
            <div className="w-[1px] bg-white/10 my-1"></div>
            <CustomDropdown 
              options={menuCity ? TURKEY_DATA[menuCity].map(d => d.name).sort() : []} 
              selected={menuDistrict?.name} 
              onChange={handleDistrictChange}
              searchable={true}
              placeholder={menuCity ? "İlçe Seçiniz..." : "Önce İl Seçiniz"}
              side="right"
              forceOpen={isDistrictOpen} 
              setForceOpen={setIsDistrictOpen} 
            />
          </div>
        </header>

        {loading && (
            <div className="absolute inset-0 bg-slate-950/50 z-40 flex items-center justify-center backdrop-blur-sm rounded-3xl">
                 <BiLoaderAlt className="animate-spin text-5xl text-blue-500" />
            </div>
        )}

        {weather ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
             <div className="lg:col-span-3 space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-blue-900/20 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-8">
                  <div>
                    <div className="flex items-center gap-2 text-blue-200 mb-2">
                      <FiMapPin /> 
                      <span className="font-semibold text-sm tracking-wide opacity-90">{displayCity}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-3 pb-1">
                      {displayDistrict?.name}
                    </h2>
                    <p className="text-lg text-white-500 font-medium flex items-center gap-3">
                      <span className="text-2xl font-bold">{Math.round(weather.current.temperature_2m)}°</span>
                      <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                      <span>Hissedilen {Math.round(weather.current.apparent_temperature)}°</span>
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    {getWeatherIcon(weather.current.weather_code, "text-8xl", weather.current.is_day)}
                    <p className="text-base font-medium mt-2 text-blue-100/80">Güncel Durum</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                  <StatPill icon={WiHumidity} label="Nem" value={`%${weather.current.relative_humidity_2m}`} />
                  <StatPill icon={WiStrongWind} label="Rüzgar" value={`${weather.current.wind_speed_10m} km/s`} />
                  <StatPill icon={WiBarometer} label="Basınç" value={`${Math.round(weather.current.surface_pressure)} hPa`} />
                  <StatPill icon={MdAir} label="UV İndeks" value={weather.daily.uv_index_max[0]} />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300">
                  <WiTime3 className="text-2xl"/> Saatlik Tahmin
                </h3>
                <div tabIndex={-1} className="flex overflow-x-auto gap-4 pb-4 scrollbar-custom outline-none focus:outline-none">
                  {weather.hourly.time.slice(0, 24).map((time, index) => {
                    const hour = new Date(time).getHours()
                    const now = new Date().getHours()
                    if (index < now && index > now - 1) return null 
                    return (
                      <div key={index} className={`min-w-[80px] flex flex-col items-center p-4 rounded-2xl border ${index === now ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/5 hover:bg-white/10'} transition-all`}>
                        <span className="text-xs opacity-70 mb-2">{hour}:00</span>
                        {getWeatherIcon(weather.hourly.weather_code[index], "text-3xl mb-2", weather.hourly.is_day[index])}
                        <span className="font-bold text-lg">{Math.round(weather.hourly.temperature_2m[index])}°</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-fit">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-300">
                  <FiCalendar /> 7 Günlük Tahmin
                </h3>
                <div className="space-y-1">
                  {weather.daily.time.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group">
                      <span className="w-16 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">{idx === 0 ? 'Bugün' : formatDate(day)}</span>
                      <div className="flex items-center gap-3">
                          {getWeatherIcon(weather.daily.weather_code[idx], "text-2xl")}
                          <div className="flex gap-2 text-sm w-20 justify-end">
                            <span className="font-bold">{Math.round(weather.daily.temperature_2m_max[idx])}°</span>
                            <span className="opacity-50">{Math.round(weather.daily.temperature_2m_min[idx])}°</span>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-white/10 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Güneş Durumu</h3>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                    <WiSunrise className="text-4xl text-orange-400 mb-1" />
                    <span className="text-xs opacity-60">Doğum</span>
                    <span className="font-bold text-lg">{new Date(weather.daily.sunrise[0]).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10"></div>
                  <div className="flex flex-col items-center">
                    <WiSunset className="text-4xl text-purple-400 mb-1" />
                    <span className="text-xs opacity-60">Batım</span>
                    <span className="font-bold text-lg">{new Date(weather.daily.sunset[0]).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[65vh] text-center space-y-8 animate-fade-in relative z-10">
              <div className="relative group cursor-default">
                  <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative bg-white/5 p-8 rounded-full border border-white/10 backdrop-blur-sm ring-1 ring-white/5">
                     <FiMapPin className="text-6xl text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                  </div>
              </div>

              <div className="max-w-xl space-y-3">
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                   {greeting}, SkyPulse.
                </h2>
                <p className="text-xl text-slate-300 font-light">
                   Gökyüzünün nabzını tutmaya hazır mısın?
                </p>

                <div 
                  onClick={() => {
                    if(cityButtonRef.current) {
                        cityButtonRef.current.focus();
                        setIsCityOpen(true);
                    }
                  }}
                  className="pt-10 flex flex-col items-center gap-3 cursor-pointer group transition-all hover:scale-105"
                >
                     <div className="flex items-center gap-2 text-sm text-blue-300 uppercase tracking-[0.2em] font-semibold group-hover:text-blue-200 transition-colors">
                        {menuCity 
                            ? `${menuCity} SEÇİLDİ, İLÇE SEÇİN` 
                            : "BAŞLAMAK İÇİN İL SEÇİMİ YAPIN"
                        }
                        {!menuCity && <span className="hidden md:inline-block px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-400 group-hover:text-white transition-colors border border-white/5">CTRL + .</span>}
                     </div>
                     <FiArrowUp className="text-slate-500 text-xl group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
          </div>
        )}
        <div className="mt-10 text-center border-t border-white/5 pt-6">
           <p className="text-slate-500 text-sm font-mono">DEVELOPED BY ONUR KESKIN © 2025</p>
        </div>
      </div>
      <style>{`
        .scrollbar-custom::-webkit-scrollbar { height: 6px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  )
}

function CustomDropdown({ options, selected, onChange, icon: Icon, searchable = false, placeholder = "Ara...", side = 'left', forceOpen = false, setForceOpen = null, triggerRef = null, shortcutHint = null }) {
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
        if(searchable && searchInputRef.current) {
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
        className="flex items-center gap-2 bg-transparent text-sm text-white px-4 py-2.5 rounded-xl hover:bg-white/10 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 transition-colors outline-none min-w-[160px] justify-between border border-transparent group"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-slate-400" />}
          <span className="truncate max-w-[100px]">{selected || placeholder}</span>
        </div>
        <div className="flex items-center gap-2">
             {shortcutHint && !selected && (
                 <span className="hidden md:block text-[10px] text-slate-500 border border-white/10 px-1.5 rounded bg-white/5 group-hover:bg-white/10 group-hover:text-slate-400 transition-colors">
                    {shortcutHint}
                 </span>
             )}
             <FiChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className={`absolute top-full ${positionClass} mt-2 w-64 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in ring-1 ring-black/5`}>
          {searchable && (
            <div className="p-2 sticky top-0 bg-[#0f172a] border-b border-white/10 z-10">
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholder}
                  className="w-full bg-white/5 text-white text-sm pl-8 pr-3 py-2 rounded-lg outline-none focus:bg-white/10 transition-colors placeholder:text-slate-500"
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
          <div ref={listRef} className="max-h-60 overflow-y-auto scrollbar-custom py-1">
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
                    ${focusedIndex === index && selected !== option ? 'bg-white/10 text-white' : ''}
                    ${selected !== option && focusedIndex !== index ? 'text-slate-300 hover:bg-white/5 hover:text-white' : ''}
                  `}
                >
                  {option}
                  {selected === option && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 text-center">Sonuç bulunamadı</div>
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
        <p className="font-bold text-lg leading-none">{value}</p>
      </div>
    </div>
  )
}

export default App