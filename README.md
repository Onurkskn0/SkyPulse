⛅ SkyPulse | Türkiye Genelinde Hava Durumu Uygulaması

 
 Demoyu görmek için: https://sky-pulse-mu.vercel.app


📝 Proje Açıklaması
SkyPulse, modern Frontend teknolojileri kullanılarak geliştirilmiş, anlık ve 7 günlük hava durumu tahminlerini sunan bir dashboard uygulamasıdır. Projenin temel zorluğu ve yeniliği, Türkiye'nin 81 il ve ilçesini kapsayan doğru coğrafi veri setini (Geocoding) lokal olarak yönetmesidir.

Uygulama, standart API'lerin Türkçe isimlerde (Örn: "Altıeylül") yaşadığı sorunları ortadan kaldıran Hibrit Veri Mimarisi ile çalışır.

Ana Özellikler
Dinamik Dashboard: Geçerli hava durumu bilgileri, saatlik tahminler ve 7 günlük özet, şık bir Bento Grid düzeninde sunulur.

Tamamen Yerelleştirilmiş Veri: 81 ilin tamamı ve ilçeleri lokal veri dosyasında (cities.js) tutulur.

Hatasız Konum Seçimi: Özel olarak tasarlanan "Searchable Dropdown" (Arama yapılabilir menü) ile hızlı ve karmaşa olmadan konum seçimi. (Mobil Ekran Taşması (Overflow) ve Otomatik Doldurma (Autocomplete) sorunları çözülmüştür.)

Premium Tasarım: Tailwind CSS ile Apple Weather uygulamalarına benzer, koyu temalı (Dark Mode) ve buzlu cam (Glassmorphism) efektli modern UI.

Sıfır API Maliyeti: OpenMeteo API'si kullandığı için ücretsizdir ve limitsiz veri çekebilir.

🛠️ Teknolojik Yığın (Stack)
Bu proje, bir Junior Frontend Developer'ın yetkinliğini göstermesi gereken en güncel araçları kullanır:

Frontend Çekirdek: ReactJS (Hooks: useState, useEffect, useRef)

İskelet / Hız: Vite

Stilleme: Tailwind CSS (Utility-First Yaklaşım)

Veri Çekme: Fetch API (Native JavaScript)

İkonografi: react-icons (Wi, Fi, Bi setleri)

Veri Kaynağı: OpenMeteo (Hava Durumu)

Demo Yayınlama: Vercel

🏗️ Mimari ve Çözüm Yaklaşımı
Kodun en kritik kısmı, API çağırma mantığını sadeleştirmesidir.

Hibrit Veri Yönetimi: Kullanıcı bir ilçe seçtiğinde, kod Geocoding API'ye sormak yerine, direkt olarak cities.js'e bakar ve buradaki güvenilir enlem/boylam (lat/lon) koordinatlarını OpenMeteo API'sine gönderir. Bu, hem hatasız çalışır hem de geleneksel yöntemlerden daha hızlıdır.

🏁 Kurulum ve Başlatma
Projeyi bilgisayarınızda çalıştırmak için:

Depoyu Klonlayın:

Bash

git clone https://github.com/Onurkskn0/SkyPulse.git
cd SkyPulse
Bağımlılıkları Yükleyin:

Bash

npm install
# (Bu adımda Tailwind CSS ve react-icons da yüklenecektir.)
Projeyi Çalıştırın:

Bash

npm run dev
# (Tarayıcınızda localhost:5173 adresinde açılacaktır.)
💻 Geliştirici | Onur Keskin

GitHub: https://github.com/Onurkskn0

LinkedIn: https://www.linkedin.com/in/onur-kskn0
