# CherryLuvv Market

## Yang akan dibangun
- Etalase Pasar Setan berbahasa Indonesia dengan identitas kawaii premium, ilustrasi produk khusus, navigasi mobile, dan halaman beranda lengkap.
- Katalog dengan pencarian, filter kategori, pengurutan, pilihan paket, stok, detail produk, keranjang, dan pembelian langsung.
- Akun pelanggan melalui email atau Google, profil, checkout tervalidasi, konfirmasi pesanan, riwayat, dan pelacakan pesanan.
- Panel admin terlindungi untuk ringkasan, produk, stok, pesanan, pelanggan, pembayaran, dan perubahan status.

## Data dan keamanan
- Lovable Cloud menyimpan kategori, produk, varian, profil, pelanggan, pesanan, item pesanan, pembayaran, dan peran admin.
- Harga akhir dihitung di sisi aman dari harga katalog; masukan pelanggan divalidasi; nomor pesanan dan kunci anti-duplikasi dibuat server-side.
- Hak admin berada pada tabel peran terpisah dan diverifikasi server-side; pelanggan hanya dapat melihat data miliknya.
- Katalog dapat dibaca publik, sedangkan checkout, riwayat, profil, dan admin memerlukan login.

## Halaman
- `/` Beranda
- `/shop` Katalog
- `/produk/:slug` Detail produk
- `/keranjang` Keranjang
- `/checkout` Checkout
- `/pesanan/:orderId` Konfirmasi/detail pesanan
- `/cek-pesanan` Pelacakan
- `/auth` Masuk/daftar dan pemulihan kata sandi
- `/akun` Profil dan riwayat pelanggan
- `/admin` Dashboard pengelolaan

## Verifikasi
- Memeriksa tampilan desktop dan mobile, alur katalog → keranjang → checkout, akses login, pelacakan pesanan, serta perlindungan halaman admin.
