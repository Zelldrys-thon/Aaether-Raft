# Sistem Gameplay Arena Kreatif: Alchemical Elixir Throwing & Tactical Deployables

Rencana perancangan dan implementasi sistem kombat taktis **Elixir Throwing + Deployable Objects** di dalam arena 3D *Aether Rift* yang memungkinkan pemain memanipulasi medan tempur secara real-time melalui 4 jenis Elixir zona berelemen, 4 Deployable Objects interaktif, serta reaksi kombinasi berantai yang dibeli melalui Gold Shop dan dikendalikan lewat **Bar Sabuk Taktis (Tactical Belt)** di bagian bawah-tengah layar.

---

## User Review & Keputusan Desain yang Dikonfirmasi

> [!IMPORTANT]
> Seluruh fitur ini dirancang khusus untuk memperkaya **gameplay di dalam Arena Pertandingan (`games`)** tanpa mengubah alur halaman Lobby, halaman Pick/Mode, desain dasar Hero, maupun navigasi utama yang sudah berjalan.

- **Akuisisi & Ekonomi Item (Confirmed)**: Elixir dan Deployable Objects dibeli menggunakan **Gold melalui Shop di Arena** (*Sanctum Armory* diperluas dengan kategori *Tactical Elixirs* & *Deployables*).
- **4 Jenis Elixir & Efek Zona (Confirmed)**:
  1. **Pyro-Scorch Elixir (Elixir Api — *Damaged Area*)**: Menciptakan zona kobaran api yang memberikan *Damage over Time (DoT)* serta memicu ledakan/pembakaran hebat saat mengenai objek.
  2. **Cryo-Barrier Elixir (Elixir Es — *Block Area*)**: Menciptakan zona dinding kristal es yang memblokir jalur pergerakan (*pathing block*) dan mengubah objek menjadi perangkap pembekuan (*Freeze Trap*).
  3. **Volt-Mirage Elixir (Elixir Listrik — *Invisible Area*)**: Menciptakan kubah kabut statis halimun (*Stealth/Invisible Zone*) bagi tim sekutu sekaligus menghantarkan sengatan listrik berantai (*Chain Lightning*) antar objek yang kompatibel.
  4. **Vitae-Bloom Elixir (Elixir Pemulihan — *Healing Area*)**: Menciptakan zona regenerasi HP bagi sekutu dan mengaktifkan aura dukungan (*Support & Shield Aura*) berskala luas saat mengenai Totem.
- **Tata Letak Kontrol HUD (Confirmed)**: Menggunakan **Bar Sabuk Taktis (Tactical Belt Bar)** di bagian **bawah-tengah layar**, dilengkapi *hotkey* cepat untuk PC (`1–4` & `Z/X/C`) serta *tap-to-place / drag-aim* dengan indikator lintasan 3D untuk Mobile & PC.

---

## 1. Konsep Gameplay Utama & Nilai Strategis

Dalam MOBA konvensional, medan pertarungan bersifat statis—pemain hanya mengandalkan *skill* bawaan hero. Sistem **Alchemical Catalan & Deployables** mengubah arena *Aether Rift* menjadi **sandbox taktis yang dinamis**:

1. **Manipulasi Ruang & Jalur (Spatial Control)**: Pemain dapat menutup jalur sempit di hutan (*jungle choke point*) atau menahan gelombang *minion* menggunakan **Cryo-Barrier Elixir (Block Area)** dan **Aether Barricade**.
2. **Penyergapan & Manipulasi Visi (Stealth & Ambush)**: **Volt-Mirage Elixir (Invisible Area)** memungkinkan seluruh rekan tim bersembunyi di tengah sungai atau lane tanpa semak, lalu menyetrum lawan secara berantai lewat jaringan objek yang dipasang.
3. **Reaksi Katalis Antarobjek (Catalytic Object Combo)**: Melempar Elixir langsung ke tanah menghasilkan **Efek Zona Dasar**. Namun, melempar Elixir **tepat mengenai Deployable Object** memicu **Reaksi Katalis** (ledakan pecahan barikade, transformasi perangkap es pembeku, rambatan petir berantai, hingga evolusi Totem penyembuh) yang membalikkan keadaan *teamfight*.
4. **Counterplay yang Adil**: Setiap Deployable Object memiliki **HP Bar / Hit Counter** dan durasi aktif sehingga lawan dapat menghancurkannya dengan *basic attack* atau memancing reaksi objek sebelum *teamfight* dimulai.

---

## 2. Katalog Elixir & Deployable Objects

### A. 4 Alchemical Elixirs (Lemparan Zona & Pemicu Reaksi)

| Nama Elixir | Fungsi Zona Dasar (Lempar ke Tanah) | Reaksi Saat Mengenai Deployable Object | Harga Gold | Cooldown & Jangkauan |
| :--- | :--- | :--- | :--- | :--- |
| **1. Pyro-Scorch Elixir**<br>*(Elixir Api / Damaged Area)* | **Magma Scorch Zone** (Radius 4.2m, Durasi 6d): Memberikan *burn damage* 45/detik dan mengurangi Armor musuh sebesar 15%. | **Ignite & Detonate**: Meledakkan *Barricade* menjadi hujan pecahan batu berapi (220 Burst Damage + Area Burn), atau menyulut *Totem* menjadi menara semburan api. | `120g` (1 Charge, Maks 2 di tas) | CD: `8d`<br>Jarak Lempar: `13m` |
| **2. Cryo-Barrier Elixir**<br>*(Elixir Es / Block Area)* | **Glacial Block Zone** (Radius 3.6m, Durasi 5.5d): Membentuk gugusan es padat yang **memblokir pergerakan unit** (*collision obstacle*) dan memperlambat sekitar sebesar 40%. | **Cryo-Trap Transformation**: Mengubah objek apa pun yang terkena menjadi **Perangkap Pembekuan (Cryo-Stasis Trap)** yang membekukan (*Stun* 1.8d) musuh yang mendekat atau menyerangnya. | `140g` (1 Charge, Maks 2 di tas) | CD: `10d`<br>Jarak Lempar: `12m` |
| **3. Volt-Mirage Elixir**<br>*(Elixir Listrik / Invisible Area)* | **Ionized Stealth Field** (Radius 4.5m, Durasi 6d): Membuat hero sekutu di dalam area menjadi **Invisible (Camouflage)** dan meningkatkan *Move Speed* +20%. | **Arc Conduction (Listrik Merambat)**: Listrik merambat secara instan melalui seluruh objek yang kompatibel dalam jarak 11m, menciptakan garis petir yang memberikan 160 Magic Damage, *Micro-Stun* 0.6d, dan membuka posisi musuh. | `150g` (1 Charge, Maks 2 di tas) | CD: `11d`<br>Jarak Lempar: `13m` |
| **4. Vitae-Bloom Elixir**<br>*(Elixir Pemulihan / Healing Area)* | **Sanctuary Heal Zone** (Radius 4.2m, Durasi 6d): Memulihkan `65 HP/detik` dan `25 Mana/detik` bagi hero & minion sekutu di dalam area. | **Totem Aura Overcharge**: Mengaktifkan **Aura Dukungan Raksasa** pada *Spirit Totem* (Radius diperluas menjadi 7.5m, memberikan *Burst Heal* 180 HP + *Shield* 150 HP ke sekutu dan memperbaiki struktur). | `130g` (1 Charge, Maks 2 di tas) | CD: `9d`<br>Jarak Lempar: `13m` |

---

### B. 4 Deployable Objects (Objek Taktis di Arena)

Pemain dapat memasang maksimal **3 Deployable Objects aktif secara bersamaan** di arena (memasang objek ke-4 akan menggantikan objek paling lama).

| Nama Objek | Fungsi Dasar di Arena | Sifat Interaksi terhadap Elixir | Harga Gold | HP / Durasi / Jarak Pasang |
| :--- | :--- | :--- | :--- | :--- |
| **1. Runic Barricade**<br>*(Barikade Penghalang)* | Dinding batu runa sepanjang 4.2m yang **menghalangi jalan hero, minion, dan monster** untuk menutup jalur kabur atau menahan gelombang minion. | **Menyerap & Meledak / Membeku**:<br>• Terkena *Elixir Api*: Meledak hebat (*Shrapnel Detonation*) dan menyisakan kawah api.<br>• Terkena *Elixir Es*: Membesar menjadi benteng es berduri yang membekukan musuh yang menyentuhnya. | `150g` | HP: `450`<br>Durasi: `18d`<br>Jarak Pasang: `8m` |
| **2. Kinetic Snap-Trap**<br>*(Perangkap Pemicu)* | Perangkap mekanis tersembunyi di tanah. Aktif saat diinjak musuh, memberikan `110 Damage` dan efek *Root/Slow* selama 1.2 detik. | **Berubah Bentuk (Transform)**:<br>• Terkena *Elixir Es*: Berubah menjadi **Cryo-Freeze Mine** (membekukan seluruh musuh di radius 5m saat terpicu).<br>• Terkena *Elixir Api*: Berubah menjadi **Inferno Cluster Mine** dengan ledakan ganda. | `130g` | HP: `180`<br>Durasi: `25d`<br>Jarak Pasang: `9m` |
| **3. Aether Totem**<br>*(Totem Area)* | Pilar energi yang memancarkan gelombang *regen* ringan (`+15 HP/d`) dalam radius 4m di sekitarnya. | **Menyerap & Memperkuat Aura (Amplify)**:<br>• Terkena *Elixir Pemulihan*: Mengaktifkan **Overcharged Support Aura** (Radius 7.5m, *Heal* deras + *Shield* + *Attack Speed* untuk tim).<br>• Terkena *Elixir Api*: Memancarkan gelombang *Solar Pulse* yang membakar musuh di sekitar totem setiap detik. | `160g` | HP: `380`<br>Durasi: `20d`<br>Jarak Pasang: `8.5m` |
| **4. Prismatic Pylon**<br>*(Konduktor & Pemantul)* | Kristal fokus optik yang berdiri di arena dan memperlambat proyektil musuh di dekatnya. | **Memantulkan & Merambatkan (Reflect & Chain)**:<br>• **Pantulan Elixir**: Elixir apa pun yang dilempar ke *Prismatic Pylon* akan **dipantulkan dan digandakan** ke arah musuh terdekat dalam jarak 8m (memperluas jangkauan lempar).<br>• **Konduktor Listrik**: Menjadi titik simpul utama rambatan petir **Elixir Listrik**, menghubungkan petir ke objek lain dan menciptakan kubah *Stealth* kedua di lokasi pantulan. | `170g` | HP: `320`<br>Durasi: `22d`<br>Jarak Pasang: `10m` |

---

## 3. Matriks Kombinasi & Skenario Pertarungan Nyata

1. **Kombo "Glacial Ambush" (Cryo-Barrier + Kinetic Snap-Trap + Runic Barricade)**:
   - Pemain memasang **Runic Barricade** di jalur sempit sungai untuk menutup jalan mundur lawan, menaruh **Kinetic Snap-Trap** di depannya, lalu melempar **Cryo-Barrier Elixir (Elixir Es)** tepat mengenai perangkap. Perangkap berubah menjadi **Perangkap Pembekuan**; begitu musuh terpaksa lewat di samping barikade, mereka langsung membeku selama 1.8 detik.
2. **Kombo "Phantom Tesla Grid" (2 Prismatic Pylon + Volt-Mirage Elixir)**:
   - Pemain memasang dua **Prismatic Pylon** secara diagonal di *Mid Lane*, lalu melempar **Volt-Mirage Elixir (Elixir Listrik)** ke Pylon pertama. Elixir memantul ke Pylon kedua, menciptakan **2 zona Invisible (Stealth)** bagi tim sekaligus membentangkan **kabel petir bertegangan tinggi** di antara kedua Pylon yang menyengat minion dan hero lawan yang lewat.
3. **Kombo "Fortress Siege & Sanctuary" (Aether Totem + Vitae-Bloom Elixir di Bawah Tower)**:
   - Saat menekan atau mempertahankan Tower, pemain memasang **Aether Totem** di belakang tim lalu melemparkan **Vitae-Bloom Elixir (Elixir Pemulihan)** ke Totem tersebut. Totem menyala terang dan memancarkan **Aura Dukungan + Perisai (Shield)** yang menahan serangan *dive* lawan.
4. **Kombo "Demolition Breach" (Runic Barricade + Pyro-Scorch Elixir)**:
   - Ketika musuh berkumpul untuk menghancurkan **Runic Barricade** yang menghalangi jalan mereka, pemain melemparkan **Pyro-Scorch Elixir (Elixir Api)** tepat ke arah Barricade tersebut—memicu ledakan pecahan batu berapi yang menghantam seluruh musuh di sekitarnya dan meninggalkan zona api pembakar.

---

## 4. Interaksi dengan Unit & Lingkungan Arena

- **Interaksi dengan Hero (Sekutu & Lawan)**:
  - Hero sekutu yang berada di dalam **Volt-Mirage Zone (Invisible Area)** memiliki tampilan *semi-transparan (stealth shimmer)*, tidak dapat ditarget oleh *auto-attack* minion/tower maupun AI musuh kecuali musuh masuk ke jarak sangat dekat (`< 2.5m`) atau terkena efek pengungkap.
  - **Runic Barricade** dan **Cryo-Barrier Zone (Block Area)** menerapkan resolusi tabrakan fisik (*circle-segment / circle-circle collision*) sehingga hero tidak dapat menembusnya kecuali menggunakan skill *blink/dash* tertentu.
- **Interaksi dengan Minion & Monster Hutan (Jungle)**:
  - Gelombang *Minion* akan tertahan atau berbelok mengikuti penghalang **Runic Barricade** & **Cryo-Barrier**, memungkinkan strategi *wave freezing* atau mengumpulkan gelombang minion besar (*super wave*).
  - *Jungle Monster* (Golem, Wolf, Sentinel) memicu **Kinetic Snap-Trap** dan menerima *damage* penuh dari reaksi ledakan Elixir Api maupun sengatan berantai Elixir Listrik, mempercepat *jungle clear* atau membantu mencuri objektif.
- **Interaksi dengan Tower & Base**:
  - Objek tidak dapat dipasang tepat menumpuk di dalam fondasi Tower (`jarak minimal 3.5m`), namun **Overcharged Aether Totem** (hasil kombo *Elixir Pemulihan*) yang dipasang di dekat Tower sekutu akan memulihkan perisai energi tipis pada Tower dan menahan *minion wave* lawan.
- **Interaksi dengan Terrain (Sungai Limbah & Semak)**:
  - Melempar **Volt-Mirage Elixir (Listrik)** di atas **Sungai** memperluas radius rambatan listrik sebesar `+25%` karena sifat konduktif air sungai.
  - Melempar **Pyro-Scorch Elixir (Api)** di area rumput/semak membakar semak tersebut sementara dan membuka persembunyian di area itu.

---

## 5. Pengalaman Pengguna (UX), Visual 3D, & Kontrol PC/Mobile

### A. Alur Penggunaan & Tata Letak Bar Sabuk Taktis (Bottom-Center HUD)

Sesuai pilihan yang dikonfirmasi, seluruh item taktis diakses melalui **Bar Sabuk Taktis (Tactical Belt Bar)** yang ramping di **bagian bawah-tengah layar** tanpa menghalangi karakter di tengah viewport:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Minimap 3-Lane]        [ALLY 4 · 03:45 · ENM 2 | Shop · 850g]   [Zoom/Cam]│
│                                                                            │
│                                                                            │
│                         3D MOBA ARENA VIEWPORT                             │
│          (Indikator Jarak Pasang, Lintasan Parabolik Elixir,               │
│            Zona Elemen Aktif, & Garis Sinergi Antar-Objek)                 │
│                                                                            │
│                                                                            │
│  [Joystick]        ┌──────────────────────────────────────┐    [Q][W][E]   │
│  (Mobile)          │  ELIXIRS [1][2][3][4] | OBJ [Z][X]   │    [ ATTACK ]  │
│                    └──────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────────────────┘
```

1. **Pembelian di Sanctum Armory (Gold Shop)**:
   - Tombol **Shop** di bagian atas tengah membuka panel toko yang kini memiliki tab: **Equipment Stats**, **Alchemical Elixirs (4 jenis)**, dan **Deployable Objects (4 jenis)**.
   - Saat pertandingan dimulai, pemain dibekali **1 Starter Elixir** dan **1 Starter Deployable** gratis agar mekanik baru ini langsung dapat dicoba sejak detik pertama, serta dapat membeli stok tambahan kapan saja dengan Gold.
2. **Pemilihan & Indikator Bidikan (Aiming & Trajectory Preview)**:
   - **Di PC**: Tekan *hotkey* `1`–`4` (untuk 4 slot Elixir) atau `Z`, `X`, `C`, `V` (untuk 4 jenis Deployable Object), atau klik ikon pada **Bar Sabuk Taktis** di bawah-tengah.
     - Saat aktif, muncul **Lingkaran Jangkauan Lempar/Pasang** di sekitar hero dan **Target Reticle 3D** mengikuti kursor mouse di tanah.
     - Jika membidik ke dekat **Deployable Object yang kompatibel**, muncul **Garis Sinergi Berkilau (Combo Synergy Indicator)** dan label singkat (mis. `COMBO: CRYO FREEZE TRAP` atau `COMBO: CHAIN LIGHTNING`) sebelum dilempar!
     - Klik kiri di tanah untuk melempar/memasang, atau klik kanan / `ESC` untuk membatalkan.
   - **Di Mobile / Layar Sentuh**:
     - **Metode 1 (Drag-and-Release)**: Tahan dan geser (*drag*) langsung dari slot di **Bar Sabuk Taktis** untuk mengarahkan reticle 3D di arena, lalu lepaskan jari untuk melempar Elixir atau memasang objek.
     - **Metode 2 (Tap-to-Place)**: Ketuk sekali slot pada **Bar Sabuk Taktis** untuk menyalakan indikator bidikan, lalu ketuk titik mana saja di lantai arena 3D untuk langsung melempar/memasang ke titik tersebut.

### B. Indikator Visual 3D & Feedback Suara

- **Model Prosedural 3D Bertekstur (Composite `THREE.Group`)**:
  - Setiap Deployable Object dibangun dari komposisi geometri 3D multi-bagian (*Runic Barricade* dengan pahatan batu & kristal menyala, *Kinetic Snap-Trap* dengan rahang mekanis bergerigi, *Aether Totem* dengan cincin mengambang berputar, dan *Prismatic Pylon* dengan inti kristal kaca oktahedral).
- **Lintasan Lemparan Parabolik (Arc Projectile)**:
  - Saat Elixir dilempar, botol kristal melayang membentuk kurva parabolik di udara selama `0.35 detik` sebelum pecah di titik target.
- **Visual Zona Jelas & Terbaca**:
  - **Damaged Area (Api)**: Lingkaran retakan magma merah-oranye dengan partikel bara naik.
  - **Block Area (Es)**: Formasi pilar kristal es biru-sian yang menonjol dari tanah disertai cincin batas tabrakan.
  - **Invisible Area (Listrik)**: Kubah kabut ungu-sian transparan dengan kilatan listrik statis di tepinya.
  - **Healing Area (Pemulihan)**: Lingkaran sigil hijau-emas dengan partikel cahaya penyembuh yang naik perlahan.

---

## 6. Arsitektur Teknis, Performa, & Mitigasi Risiko

### Diagram Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MatchHudOverlay (React UI)                       │
│  ┌──────────────────────────┐        ┌───────────────────────────────┐  │
│  │ Sanctum Armory Gold Shop │        │ Bottom-Center Tactical Belt   │  │
│  │ (Tab: Gear | Elixir | Obj)│        │ (Elixir Slots 1-4 & Deploy Z-V)│  │
│  └────────────┬─────────────┘        └───────────────┬───────────────┘  │
└───────────────┼──────────────────────────────────────┼──────────────────┘
                │ onBuyTacticalItem()                  │ onAim / onUseTactical()
                ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MobaGameEngine (Three.js Core)                     │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │ TacticalSystemMgr    │  │ CatalyticComboEngine│  │ 3D Aim & Combo │  │
│  │ • Projectile Flight  │──▶ • Elixir x Object   │──▶ Reticle Preview│  │
│  │ • Active Zones (4)   │  │   Reaction Resolver │  │ (Synergy Line) │  │
│  │ • Deployables (Max 3)│  │ • Chain Lightning   │  └────────────────┘  │
│  └──────────┬───────────┘  └──────────┬──────────┘                      │
│             │                         │                                 │
│             ▼                         ▼                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Combat, Collision & AI Loop (60 FPS Delta Tick)                   │  │
│  │ • Pathing Obstacle Collision (Barricade & Cryo Block Area)        │  │
│  │ • Stealth Camouflage Filtering (Volt Invisible Area)              │  │
│  │ • DoT / Heal / Freeze Stun / Bot AI Counterplay & Target Priority │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Optimasi Performa & Pencegahan Konflik Kode Lama

1. **Zero Garbage Collection (GC) di Render Loop**:
   - Seluruh perhitungan jarak zona, tabrakan barikade, dan lintasan parabolik Elixir menggunakan variabel skalar `(x, z)` dan vektor *pre-allocated* tanpa membuat `new THREE.Vector3()` di dalam `tick()`.
2. **Batas Objek Aktif & Reuse Material**:
   - Maksimal **3 Deployable Objects** per tim dan maksimal **4 Active Elixir Zones** secara bersamaan untuk menjaga jumlah *draw call* tetap ringan di perangkat Android maupun PC.
   - Geometri dan material PBR untuk botol Elixir, zona efek, serta ke-4 jenis objek di-cache satu kali pada saat inisialisasi modul.
3. **Kompatibilitas Penuh dengan Sistem Skill & Kamera 2.5D yang Ada**:
   - Ketika pemain sedang membidik Skill Hero (`Q/W/E`), membidik Elixir/Objek otomatis membatalkan mode bidik skill sebelumnya (dan sebaliknya) sehingga input klik tanah tidak pernah bentrok.
   - AI rekan tim dan AI lawan juga diberi logika cerdas sederhana untuk sesekali melempar Elixir atau menghancurkan objek penghalang lawan agar pertandingan terasa hidup.

---

## 7. Tahapan Implementasi & Rencana Pengujian

1. **Tahap 1 — Definisi Data & Tipe Taktis**:
   - Menambahkan tipe data untuk 4 Elixir (`pyro_damage`, `cryo_block`, `volt_stealth`, `vitae_heal`), 4 Deployable Objects (`barricade`, `snap_trap`, `aether_totem`, `prismatic_pylon`), status inventaris taktis pemain di `MatchSnapshot`, serta daftar harga di Shop.
2. **Tahap 2 — Model 3D Prosedural & Indikator Sinergi**:
   - Membuat generator mesh 3D multi-bagian untuk ke-4 Deployable Objects, proyektil botol Elixir parabolik, 4 efek zona lantai, serta indikator bidikan 3D yang menampilkan garis konektor sinergi saat diarahkan ke objek di arena.
3. **Tahap 3 — Logika Gameplay, Fisika Penghalang, & Reaksi Kombinasi**:
   - Mengintegrasikan *Block Area* & *Barricade* ke dalam resolusi tabrakan gerak unit, *Invisible Area* ke dalam filter visibilitas & *targeting* AI, *Healing/Damaged Area* ke dalam *tick* HP unit, serta matriks reaksi ketika Elixir jatuh mengenai Deployable Object.
4. **Tahap 4 — Integrasi Gold Shop & Bar Sabuk Taktis (Bottom-Center HUD)**:
   - Memperbarui panel Shop di arena dengan kategori Elixir & Deployables serta menambahkan **Bar Sabuk Taktis** di bagian bawah-tengah layar yang mendukung *hotkey* PC, *tap-to-cast*, dan *drag-to-aim* di Mobile.
5. **Tahap 5 — Verifikasi Kompilasi & Keseimbangan Gameplay**:
   - Menjalankan pemeriksaan `compile_applet` dan `lint_applet` untuk memastikan nol *error* TypeScript serta menguji seluruh interaksi kombo di dalam arena.
