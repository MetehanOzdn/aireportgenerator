/**
 * templates.js
 * Contains the static content of report templates.
 */

const REPORT_TEMPLATES = {
    "BT Beyin": {
        "Acil Kontrastsız Beyin BT": `{patient_name}

{patient_id}

{birth_date}

{study_date}

Teknik: 

ACİL KONTRASTSIZ BEYİN BT İNCELEMESİ

Karşılaştırma:

Bulgular:

Ventriküler sistem simetrik ve normal genişliktedir.

Serebral ve serebeller sulkuslarda acil patoloji izlenmemiştir.

Bilateral bazal ganglionlar, talamuslar, her iki sentrum semiovale normaldir .

İntrakranial masiv kanama izlenmedi .     

Kemik yapılarda major patoloji izlenmedi.

Sonuç:

Olguya ait patolojiler 'Bulgular' kısmında belirtilmiş olup klinik, fizik muayene ve laboratuvar verileri ile birlikte korelasyonu ve ileri evalüasyonu önerilir.

Not; İnceleme acil istek üzerine ,verilen klinik bilgi  doğrultusunda raporlanmıştır. Klinik bulgular ve Radyolojik raporun uyuşmazlık durumunda tekrar değerlendirme yapılacaktır. 

Değerlendirme: 44

                                                                                                                                           

{approved_user}
Diploma No: {diploma_no}
Tescil No: {registration_no}
`,
        "Yaşlı Beyin (Atrofi)": `{patient_name}

{patient_id}

{birth_date}

{study_date}

Teknik: 

ACİL KONTRASTSIZ BEYİN BT İNCELEMESİ


Karşılaştırma:


Bulgular: 

 

Supratentoriyal orta hat oluşumları normal şekil ve lokalizasyondadır

Periventriküler derin beyaz cevherde kronik iskemik değişiklikler izlenmiştir.

Serebral sulkusların derinlik ve genişlikleri serebral atrofi ile uyumlu şekilde artmıştır.

İntrakranial kanama izlenmedi.

Sella ve orbitada makropatoloji görülmemektedir.
                     

Sonuç:

Olguya ait patolojiler 'Bulgular' kısmında belirtilmiş olup klinik, fizik muayene ve laboratuvar verileri ile birlikte korelasyonu ve ileri evalüasyonu önerilir.

 

Not: İnceleme acil istek üzerine ,verilen klinik bilgi  doğrultusunda raporlanmıştır. Klinik bulgular ve Radyolojik raporun uyuşmazlık durumunda tekrar değerlendirme yapılacaktır. 

 

Değerlendirme: 44

 
 

                                                                                                                                                                 

{approved_user}
Diploma No: {diploma_no}
Tescil No: {registration_no}
`,
        "Normal Kontrastsız Beyin BT": `{patient_name}

{patient_id}

{birth_date}

{study_date}

Teknik:

KONTRASTSIZ BEYİN BT İNCELEMESİ

Karşılaştırma:

Bulgular: 

Supratentoriyal orta hat oluşumları normal şekil ve lokalizasyondadır.

Ventriküler sistem simetrik ve normal genişliktedir.

Sylvian fissürler, interhemisferik fissür ve kortikal hemisferik sulkuslar açıktır.

Beyin parankim alanlarında patolojik dansite değişikliği saptanmamıştır.

İntrakranial majör kanama izlenmedi.

Kranium kemik yapısı ve ekstrakranial yumuşak dokular tabiidir.

Sonuç: 

Olguya ait patolojiler 'Bulgular' kısmında belirtilmiş olup klinik, fizik muayene ve laboratuvar verileri ile birlikte korelasyonu ve ileri evalüasyonu önerilir.

Değerlendirme: 44

{approved_user}
Diploma No: {diploma_no}
Tescil No: {registration_no}`
    },
    "BT Toraks": {
        "Acil Kontrastsız Toraks BT": `{patient_name}

{patient_id}

{birth_date}

{study_date}

Teknik:

ACİL KONTRASTSIZ TORAKS BİLGİSAYARLI TOMOGRAFİ (BT) İNCELEME

Karşılaştırma: 

Bulgular: 

Hemotoraks lehine bulgu saptanmadı.

Pnömotoraks gözlenmedi.

Her iki akciğerde acil şartlarda değerlendirmede major patoloji saptanmamıştır.

Plevral effüzyon izlenmedi .

Sonuç:

Olguya ait patolojiler 'Bulgular' kısmında belirtilmiş olup klinik, fizik muayene ve laboratuvar verileri ile birlikte korelasyonu ve ileri evalüasyonu önerilir.

 
Not; İnceleme acil istek üzerine ,verilen klinik bilgi  doğrultusunda raporlanmıştır. Klinik bulgular ve Radyolojik raporun uyuşmazlık durumunda tekrar değerlendirme yapılacaktır. 
 
Değerlendirme: 44
 

{approved_user}
Diploma No: {diploma_no}
Tescil No: {registration_no}`,
        "Yaşlı Akciğer": `{patient_name}

{patient_id}

{birth_date}

{study_date}

Teknik:

ACİL KONTRASTSIZ TORAKS BİLGİSAYARLI TOMOGRAFİ (BT) İNCELEME

Karşılaştırma: 

Bulgular: 

Hemotoraks lehine bulgu saptanmadı.

Pnömotoraks gözlenmedi.

Her iki akciğerde acil şartlarda değerlendirmede major patoloji saptanmamıştır.

Plevral effüzyon izlenmedi .

Sonuç:

Olguya ait patolojiler 'Bulgular' kısmında belirtilmiş olup klinik, fizik muayene ve laboratuvar verileri ile birlikte korelasyonu ve ileri evalüasyonu önerilir.

 
Not; İnceleme acil istek üzerine ,verilen klinik bilgi  doğrultusunda raporlanmıştır. Klinik bulgular ve Radyolojik raporun uyuşmazlık durumunda tekrar değerlendirme yapılacaktır. 
 
Değerlendirme: 44
 

{approved_user}
Diploma No: {diploma_no}
Tescil No: {registration_no}`,
        "Normal Kontrastsız Toraks BT": `{patient_name}

{patient_id}

{birth_date}

{study_date}

Teknik: 

KONTRASTSIZ TORAKS BİLGİSAYARLI TOMOGRAFİ (BT) İNCELEME

Karşılaştırma: 

Bulgular: 

Mediastinal ana vasküler yapılar ve kalp konfigürasyonu normaldir.

Trakea orta hattadır. Trakea ve her iki ana bronş açıktır.

Mediastinal ya da hiler yerleşimli patolojik boyut artışı gösteren lenf nodu izlenmemiştir.

Her iki akciğer parankiminde aktif infiltrasyon ya da kitle imajı izlenmemiştir.

Plevral kalsifikasyon, kalınlaşma veya effüzyon izlenmemiştir.

Kemik yapılar doğal görünümdedir.

Sonuç:

Olguya ait patolojiler 'Bulgular' kısmında belirtilmiş olup klinik, fizik muayene ve laboratuvar verileri ile birlikte korelasyonu ve ileri evalüasyonu önerilir.

Değerlendirme: 44

{approved_user}
Diploma No: {diploma_no}
Tescil No: {registration_no}`
    }
};
