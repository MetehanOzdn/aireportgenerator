# Google Gemini Entegrasyon Dokümantasyonu

Bu belge, **Radyoloji Asistanı Simülatörü** projesinde Google Gemini API'sinin nasıl kullanıldığını, teknik detayları ve konfigürasyonu açıklar.

## 1. Kimlik Doğrulama (Authentication)
Proje, istemci taraflı (Client-Side) çalıştığı için API anahtarı `localStorage` üzerinde saklanır ve doğrudan istek URL'sine parametre olarak eklenir. Sunucu tarafı (backend) proxy kullanılmamıştır.

*   **Yöntem:** Query Parameter
*   **Parametre:** `?key=YOUR_API_KEY`
*   **Güvenlik:** Anahtar tarayıcıda saklanır, sunucuya iletilmez.

## 2. Kullanılan Modeller
Proje şu an için aşağıdaki Google modellerini destekler (v1beta API):
*   `gemini-1.5-flash` (Varsayılan - Hızlı ve Kararlı)
*   `gemini-1.5-pro` (Yüksek Muhakeme)
*   `gemini-2.0-flash-exp` (Deneysel - En yeni)

## 3. İstek Yapısı (Request Payload)
İstekler `POST` metodu ile gönderilir. Payload yapısı **Multimodal** (Ses + Metin) olacak şekilde kurgulanmıştır.

### Örnek JSON Payload
```json
{
  "system_instruction": {
    "parts": [
      { "text": "You are an expert radiologist assistant. Your task is to extract information from the provided radiology transcript and fill out the provided report template..." }
    ]
  },
  "contents": [
    {
      "parts": [
        { "text": "Please fill out the following template based on the audio:\n\n{TEMPLATE_CONTENT}" },
        {
          "inline_data": {
            "mime_type": "audio/mp3",
            "data": "BASE64_ENCODED_AUDIO_STRING..."
          }
        }
      ]
    }
  ]
}
```

### 3.1. System Instruction (Sistem Talimatı)
Modele "Uzman Radyolog Asistanı" rolü atanmıştır. Bu bölümde:
1.  ASR (Ses Tanıma) hatalarını düzeltmesi,
2.  Tıbbi terminolojiyi koruması,
3.  Sadece raporu çıktı olarak vermesi (sohbet etmemesi) emredilir.

### 3.2. Template Injection (Şablon Enjeksiyonu)
Kullanıcı arayüzüzden bir şablon seçtiğinde (örn: `BT Beyin`), bu şablon metni doğrudan User Prompt içine gömülerek (`{text}`) modele gönderilir. Modelden bu boşluğu doldurması istenir.

## 4. Ses Dosyası İşleme (Audio Handling)
Gemini API, ses dosyalarını **Inline Data** (Base64) olarak kabul eder.

*   **Boyut Limiti:** İstemci tarafında **20 MB** sınırı konulmuştur (Inline veri için pratiktir).
*   **Format Düzenlemesi:**
    *   Bazı tarayıcılar ses kaydını `video/webm` olarak etiketleyebilir.
    *   Gemini API `video/` MIME türünü ses bağlamında reddedebilir (400 Bad Request hatası).
    *   **Çözüm:** Kod içinde `video/webm` detected edilirse, API'ye gönderilirken `audio/webm` olarak değiştirilir (Spoofing).

## 5. Hata Yönetimi
Proje aşağıdaki durumları yönetir:
*   **400 Invalid Argument:** Genellikle API Key hatası veya geçersiz MIME type. (Kodda otomatik düzeltmeler mevcuttur).
*   **Model Not Found:** Geçersiz model adı (Varsayılan modele fallback yapılır).

## 5. Örnek Referans Fonksiyonu (JavaScript)

Aşağıdaki fonksiyon, projedeki `script.js` dosyasından alınmış olup, isteğin nasıl oluşturulduğunu ve gönderildiğini net bir şekilde gösterir:

```javascript
async function processWithGemini(apiKey) {
    const model = APP_STATE.selectedModel; // e.g., 'gemini-1.5-flash'
    
    // 1. Template & Prompt Selection
    const category = ui.templateCategory.value;
    const templateKey = ui.templateSelect.value;
    
    let finalPrompt = "Transcribe this audio.";
    if (category && templateKey && REPORT_TEMPLATES[category]?.templates[templateKey]) {
        const templateContent = REPORT_TEMPLATES[category].templates[templateKey];
        finalPrompt = `Please fill out the following template based on the audio:\n\n${templateContent}`;
    }

    // 2. Prepare Base64 Audio & MimeType
    const base64Audio = await fileToBase64(APP_STATE.audioFile);
    let mimeType = APP_STATE.audioFile.type;
    
    // Spoof webm if needed to avoid API errors
    if (!mimeType || mimeType === 'audio/mpeg') mimeType = 'audio/mp3';
    if (mimeType === 'video/webm') mimeType = 'audio/webm'; 

    // 3. Construct Payload
    const systemPrompt = `You are an expert radiologist assistant. Your task is to extract information from the provided radiology transcript and fill out the provided report template.

IMPORTANT INSTRUCTIONS:
1. The transcript comes from an automatic speech recognition (ASR) system and MAY CONTAIN ERRORS.
2. You must use your medical knowledge to INFER and CORRECT these errors.
3. Maintain the professional medical tone of the report.
4. Output ONLY the filled report content.`;

    const payload = {
        system_instruction: {
            parts: [{ text: systemPrompt }]
        },
        contents: [{
            parts: [
                { text: finalPrompt },
                { inline_data: { mime_type: mimeType, data: base64Audio } }
            ]
        }]
    };

    // 4. Send Request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(response.statusText);
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```







# Radyoloji Asistanı Simülatörü - Çalışma Akışı (Workflow)

Bu belge, kullanıcının uygulamayı açmasından raporun oluşturulmasına kadar geçen tüm süreci teknik ve işlevsel olarak adım adım açıklar.

## 1. Hazırlık ve Konfigürasyon
Kullanıcı uygulamayı açtığında ilk olarak gerekli ayarları yapar:
*   **Sağlayıcı Seçimi:** Google Gemini veya OpenAI seçilir.
*   **API Anahtarı:** Seçilen sağlayıcıya uygun API anahtarı girilir. Bu anahtar tarayıcının `localStorage` (yerel hafıza) alanına kaydedilir, böylece sayfa yenilendiğinde tekrar girilmesi gerekmez.
*   **Model Seçimi:** Varsayılan olarak stabil modeller (örn. `gemini-1.5-flash`) seçilidir ancak kullanıcı değiştirebilir.

## 2. Şablon Seçimi (Template Selection)
Raporun formatını belirlemek için hiyerarşik bir seçim yapılır:
1.  **Kategori:** Örn. `BT Beyin`, `BT Toraks`.
2.  **Şablon:** Örn. `ACİL_BEYIN_BT`.
3.  **Önizleme:** Seçilen şablonun içeriği (başlıklar, boşluklar, standart ifadeler) anlık olarak ekranda gösterilir. Bu metin, daha sonra yapay zekaya gönderilecek olan "iskelet"tir.

## 3. Dosya Yükleme (Input)
*   **Ses Dosyası:** Radyoloji diktesini içeren ses dosyası sürükle-bırak yöntemiyle yüklenir.
*   **Referans Rapor (Opsiyonel):** Eğer kıyaslama yapılacaksa, doktorun yazdığı orijinal rapor metni de yüklenir.

## 4. İşlem Başlatma ve Ön Hazırlık (Preprocessing)
"Simülasyonu Başlat" butonuna tıklandığında arka planda şu işlemler gerçekleşir:
1.  **Base64 Dönüşümü:** Ses dosyası, API'ye gönderilebilmek için metin tabanlı Base64 formatına çevrilir.
2.  **MIME Type Kontrolü:** Tarayıcı bazen ses dosyalarını `video/webm` olarak etiketler. Gemini API bunu reddedebileceği için, bu tür dosyalar kod içinde otomatik olarak `audio/webm` veya `audio/mp3` olarak etiketlenir (Spoofing).
3.  **Prompt Hazırlığı:**
    *   **System Instruction:** Yapay zekaya "Sen uzman bir radyologsun, görevin hataları düzeltmek ve şablonu doldurmaktır" talimatı verilir.
    *   **User Prompt:** "Bu sesi dinle ve aşağıdaki şablonu doldur" komutu ile birlikte, **2. adımda seçilen şablonun tam metni** eklenir.

## 5. API İsteği (Request)
Hazırlanan veriler (Prompt + Şablon + Ses Dosyası) tek bir JSON paketi halinde Google Gemini API'sine (veya OpenAI) `POST` edilir.
*   Bu işlem sırasında kullanıcıya "AI analiz yapıyor..." durumu gösterilir.

## 6. Yanıt İşleme ve Görüntüleme (Output)
API'den gelen yanıt işlenir:
1.  **Metin Çıkarma:** JSON yanıtından üretilen rapor metni ayıklanır.
2.  **Markdown Render:** Gelen metin, kalın/italik formatları destekleyecek şekilde HTML'e çevrilir ve "AI Sonucu" sekmesinde gösterilir.

## 7. Fark Analizi (Comparison) - Opsiyonel
Eğer kullanıcı referans bir rapor dosyası da yüklemişse:
1.  **Karşılaştırma:** `diff_match_patch` algoritması çalıştırılır.
2.  **Görselleştirme:** Ekran ikiye bölünür. Sol tarafta referans rapor, sağ tarafta AI raporu gösterilir. Farklılıklar (eklenen/silinen kelimeler) renkli olarak işaretlenir.

## Özet Şema
```mermaid
graph TD
    A[Başlat] --> B[API Key & Model Seçimi]
    B --> C{Şablon Seçimi}
    C -->|Kategori + Şablon| D[Prompt Oluştur]
    D --> E[Ses Dosyası Yükle]
    E --> F[Base64 Convert & Sanitize]
    F --> G[API İsteği Gönder (JSON)]
    G --> H[AI İşlemesi]
    H --> I[Rapor Çıktısı]
    I --> J{Referans Var mı?}
    J -->|Evet| K[Fark Analizi (Split View)]
    J -->|Hayır| L[Bitiş]
```
