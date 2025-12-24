# Radyoloji Asistanı Simülatörü - Proje Dokümantasyonu

## 1. Proje Özeti
Bu proje, radyoloji uzmanlarının sesli diktelerini (MR, BT vb.) Yapay Zeka (AI) destekli olarak otomatik transkribe eden ve yapılandırılmış tıbbi raporlara dönüştüren gelişmiş bir web simülasyonudur. Sistem, üretilen raporları "Altın Standart" (Gerçek Rapor) ile kıyaslayarak doğruluk analizi yapar.

## 2. Desteklenen Yapay Zeka Teknolojileri
Proje, piyasadaki en gelişmiş LLM ve ASR (Speech-to-Text) modellerini hibrit bir yapıda kullanır:

### 🟢 Google Gemini (Yeni)
Google'ın en yeni nesil modelleri sisteme tam entegre edilmiştir.
*   **Gemini 2.0 Flash:** Hız ve maliyet odaklı, günlük rutin raporlamalar için önerilen model.
*   **Gemini 2.5 Pro:** Karmaşık vakalar ve "Chirp" seviyesinde yüksek hassasiyet gerektiren medikal transkripsiyonlar için en iyi kalite.
*   **Model Cascade (Yedekleme):** Sistem, seçili model yanıt vermezse otomatik olarak alternatif modellere (örn: 2.5 Pro -> 2.0 Flash) geçiş yaparak kesintisiz çalışma sağlar.

### 🔵 OpenAI
*   **Whisper-1:** Endüstri standardı ses tanıma.
*   **GPT-4o & GPT-4o Audio:** Çok modlu (ses+metin) işleme yeteneği ile hem transkripsiyon hem raporlama.
*   **Speaker Diarization:** Konuşmacı ayrıştırma (Doktor/Hasta veya Konsültasyon kayıtları için).

## 3. Temel Özellikler

### 🛠 Çoklu Sağlayıcı ve Model Seçimi
Kullanıcılar arayüz üzerinden **OpenAI** veya **Google** sağlayıcıları arasında anlık geçiş yapabilir. Her sağlayıcı için modele özel ayarlar (örn: "Diarization", "High Precision Mode") dinamik olarak yüklenir.

### 💾 Akıllı Ayar Yönetimi (Persistence)
Tarayıcı tabanlı "LocalStorage" altyapısı sayesinde:
*   Girilen API Anahtarları (OpenAI/Google) güvenli bir şekilde tarayıcıda saklanır.
*   Son seçilen sağlayıcı (Provider) ve model tercihleri hatırlanır.
*   Sayfa yenilendiğinde tekrar giriş yapmaya gerek kalmaz.

### 📊 Görsel Doğrulama ve Fark Analizi
AI tarafından üretilen rapor ile gerçek doktor raporu yan yana getirilir. "Diff-Match-Patch" algoritması kullanılarak:
*   **Yeşil:** Doğru eşleşen terimler.
*   **Kırmızı:** AI'ın atladığı (Eksik) bilgiler.
*   **Mavi:** AI'ın fazladan eklediği veya yanlış yorumladığı kısımlar.
renklendirilerek saniyeler içinde görsel doğrulama sağlanır.

### 🛡 Hata Toleransı ve Kararlılık
Google API hatalarına (404 Model Not Found vb.) karşı geliştirilen "Robust Cascade" mimarisi, kullanıcının API anahtarına uygun modelleri (Flash, Pro, 001 vb.) sırasıyla dener ve çalışan en iyi modeli otomatik devreye alır.

## 4. Kullanım Kılavuzu

### Kurulum
Proje tamamen **istemci taraflı (Client-Side)** çalışır. Herhangi bir sunucu kurulumu gerektirmez.
1.  Proje klasörünü indirin.
2.  `index.html` dosyasını tarayıcınızda (Chrome, Edge vb.) açın.

### Adım Adım Kullanım
1.  **Sağlayıcı Seçin:** Sağ üst köşeden "OpenAI" veya "Google" seçin.
2.  **API Anahtarı:** İlgili servis için API anahtarınızı girin (Sadece ilk seferde gereklidir, otomatik kaydedilir).
3.  **Model Seçimi:** İhtiyacınıza uygun modeli (örn: `Gemini 2.5 Pro` veya `GPT-4o Audio`) seçin.
4.  **Dosya Yükleme:**
    *   **Ses Dosyası:** Radyoloji diktesini (`.mp3`, `.wav`) sürükleyip bırakın.
    *   **Şablon:** Listeden uygun rapor şablonunu (örn: "Beyin MR") seçin.
    *   **Gerçek Rapor (Opsiyonel):** Kıyaslama yapmak istiyorsanız, referans metin dosyasını yükleyin.
5.  **Başlat:** "Simülasyonu Başlat" butonuna tıklayın.

## 5. Teknik Altyapı
*   **Frontend:** HTML5, CSS3 (Modern Glassmorphism UI), Vanilla JavaScript (ES6+).
*   **Entegrasyonlar:** Google Generative Language API (v1beta), OpenAI API.
*   **Kütüphaneler:** `diff-match-patch` (Metin kıyaslama için).

---
*Geliştirici Notu: Bu doküman projenin v2.0 sürümü (Multi-Provider & Gemini 2.0 desteği) için hazırlanmıştır.*
