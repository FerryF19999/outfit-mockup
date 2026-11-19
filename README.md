# Nemu Versi Hemat

Jalankan `node preview.cjs` untuk membuka galeri di http://127.0.0.1:62155/. Interaksi lokal disimpan dalam file .nemu-gallery-local.json di direktori pengguna. PORT dan NEMU_LOCAL_DB dapat diatur untuk preview terpisah.

## Vercel
Pilih folder proyek ini sebagai Root Directory. Konfigurasi Vercel menyalin halaman dan foto ke public/ serta menjalankan fungsi api/social.js. Gunakan Node.js 22 atau lebih baru.

Untuk menyimpan interaksi lintas pengunjung, hubungkan database Upstash Redis melalui Vercel Marketplace atau atur UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN pada environment server lalu deploy ulang. Fungsi juga menerima KV_REST_API_URL dan KV_REST_API_TOKEN. Database lokal dan produksi terpisah. Tanpa koneksi Redis pada deployment, katalog tetap bisa dibuka dan status interaksi menampilkan gangguan.

Tayangan dihitung saat detail dibuka, sekali per browser, look, dan hari WIB. Suka dapat dibatalkan. Komentar anonim maksimal 280 karakter, dengan 50 komentar terbaru ditampilkan per look. Identitas interaksi menggunakan cookie browser. Harga dan foto produk merupakan cuplikan katalog Nemu, sedangkan foto model adalah ilustrasi styling AI.
