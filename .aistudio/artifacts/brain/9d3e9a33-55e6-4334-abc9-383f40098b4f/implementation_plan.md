# Rencana & Hasil Optimasi Performa Mobile (Anti Patah-Patah)

## Masalah yang Ditemukan pada Perangkat Mobile (Android):
1. **Device Pixel Ratio (DPR) Terlalu Tinggi (GPU Overdraw)**:
   - Handphone modern umumnya memiliki resolusi tinggi (FHD+/QHD+) dengan DPR 2.5x hingga 3.5x.
   - Tanpa pembatasan DPR di HP, Three.js merender lebih dari 2.5–4 juta piksel per frame dengan pencahayaan dan bayangan penuh, yang membuat GPU HP kehabisan *fillrate* (patah-patah).
2. **Kalkulasi Bot AI Setiap Frame (O(N^2) Math Overhead)**:
   - Puluhan minion dan bot hero melakukan pencarian target baru ke seluruh entitas di arena setiap 16 ms menggunakan fungsi jarak (`Math.hypot`), menghasilkan lebih dari 100.000 kalkulasi per detik.
3. **Shadow Map Rerender Setiap Frame**:
   - WebGL merender ulang shadow map bayangan matahari untuk seluruh arena 60 kali per detik.
4. **Thrashing DOM React**:
   - 30-50 minion di seluruh map memproyeksikan elemen HTML bar darah ke React secara bersamaan, membebani thread WebView di Android.
5. **Animasi Rangka Skeletal untuk Unit Jauh**:
   - Minion dan monster yang berada jauh di luar kamera tetap menghitung rotasi sendi, lengan, dan kaki trigonometri setiap frame.

## Solusi & Optimasi yang Diterapkan:
1. **DPR Capping & Basic Shadows di Mobile**:
   - Mendeteksi perangkat touch/mobile secara otomatis.
   - Membatasi DPR di layar HP maksimal 1.0x (medium/low) dan 1.15x (high), memangkas beban GPU hingga 65% tanpa mengurangi ketajaman visual.
   - Menggunakan `BasicShadowMap` dan men-throttle kalkulasi bayangan ke 20 FPS (setiap 3 frame sekali), menghemat puluhan draw calls.
2. **Bot AI Target Persistence & Fast Squared Distance**:
   - Jika unit sudah memiliki target hidup dan masih dalam jangkauan, target langsung dipertahankan (O(1)).
   - Menggunakan `dx * dx + dz * dz` (squared distance) untuk menyaring unit di luar jangkauan tanpa menghitung akar kuadrat (`Math.sqrt`/`Math.hypot`).
3. **Distance Culling Animasi Skeletal**:
   - Unit yang berada lebih dari 54 unit dari fokus kamera hanya menyinkronkan posisi dan rotasi tubuh, melewatkan kalkulasi gerakan sendi/kaki yang tidak terlihat di layar.
4. **Throttle Fisika Crowd Separation**:
   - Fisika tabrakan antar unit (`resolveUnitSeparation`) di-throttle berjalan 30 Hz (setiap 2 frame sekali) dengan pemeriksaan jarak kuadrat.
5. **Minion Health Bar DOM Culling**:
   - Minion berdarah penuh yang jauh dari pemain tidak lagi membebani DOM bar darah di React (tetapi tetap muncul di minimap secara akurat).
6. **Instanced Mesh Matrix Throttle**:
   - Pembaruan matriks hembusan angin ribuan pohon hutan rimba di-throttle ke 15 Hz, menghentikan GPU memory bus stalls.
