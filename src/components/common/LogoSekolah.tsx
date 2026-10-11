import React from 'react';

interface LogoSekolahProps {
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

/**
 * Komponen Lambang / Logo Resmi SDN KAPUK 06 PAGI
 * Berdasarkan Logo Resmi Sekolah SDN 06 KAPUK ("SEHAT CERDAS DAN BERKARAKTER")
 * Berisi:
 * - Bingkai perisai segi lima putih dengan lis tebal hitam
 * - Teks melengkung atas: "SEHAT CERDAS DAN BERKARAKTER" dengan 2 bintang hitam di kiri & kanan
 * - Padi emas di sisi kiri & rantai/daun kapas hijau di sisi kanan
 * - Buku terbuka hijau di bawah & obor api kembar kuning/emas di atas buku
 * - Teks merah bata di bawah: "SDN KAPUK 06 PAGI"
 */
export const LogoSekolah: React.FC<LogoSekolahProps> = ({
  logoUrl,
  size = 'md',
  className = '',
  alt = 'Logo Resmi SDN Kapuk 06 Pagi',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const dim = sizeMap[size];
  const targetUrl = (logoUrl && logoUrl.trim().length > 0) ? logoUrl : 'https://i.imgur.com/GlCn0x3.png';

  if (!imgError && targetUrl) {
    return (
      <img
        src={targetUrl}
        alt={alt}
        onError={() => setImgError(true)}
        className={`${dim} object-contain drop-shadow ${className}`}
      />
    );
  }

  return (
    <svg
      className={`${dim} drop-shadow-sm select-none ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo Resmi SDN Kapuk 06 Pagi"
    >
      <defs>
        {/* Jalur teks melengkung atas untuk motto */}
        <path
          id="mottoArc"
          d="M 32,126 A 76,76 0 0,1 168,126"
          fill="none"
        />
        {/* Jalur teks melengkung bawah untuk nama sekolah */}
        <path
          id="schoolArc"
          d="M 35,152 A 75,75 0 0,0 165,152"
          fill="none"
        />
      </defs>

      {/* Bingkai Luar Perisai Segi Lima Khas SDN Kapuk 06 */}
      <path
        d="M 100,8 L 186,48 L 158,184 L 42,184 L 14,48 Z"
        fill="#FFFFFF"
        stroke="#111827"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Teks Motto Melengkung Atas */}
      <text fill="#111827" fontSize="10.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="1.2">
        <textPath href="#mottoArc" startOffset="50%" textAnchor="middle">
          SEHAT CERDAS DAN BERKARAKTER
        </textPath>
      </text>

      {/* Bintang Kiri */}
      <polygon
        points="34,136 36.5,143 44,143 38,148 40.5,155 34,151 27.5,155 30,148 24,143 31.5,143"
        fill="#111827"
      />

      {/* Bintang Kanan */}
      <polygon
        points="166,136 168.5,143 176,143 170,148 172.5,155 166,151 159.5,155 162,148 156,143 163.5,143"
        fill="#111827"
      />

      {/* Tangkai Padi Emas (Kiri) */}
      <g stroke="#d97706" fill="#f59e0b" strokeWidth="1">
        {/* Batang padi */}
        <path d="M 68,144 Q 46,108 72,56" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
        {/* Butir-butir padi kiri & kanan */}
        <ellipse cx="68" cy="62" rx="6" ry="2.8" transform="rotate(-30 68 62)" />
        <ellipse cx="61" cy="71" rx="6" ry="2.8" transform="rotate(-35 61 71)" />
        <ellipse cx="55" cy="82" rx="6.5" ry="3" transform="rotate(-40 55 82)" />
        <ellipse cx="51" cy="95" rx="7" ry="3.2" transform="rotate(-45 51 95)" />
        <ellipse cx="49" cy="109" rx="7" ry="3.2" transform="rotate(-50 49 109)" />
        <ellipse cx="50" cy="123" rx="6.5" ry="3.2" transform="rotate(-55 50 123)" />
        <ellipse cx="55" cy="136" rx="6" ry="3" transform="rotate(-60 55 136)" />
        {/* Butir dalam */}
        <ellipse cx="73" cy="74" rx="5.5" ry="2.5" transform="rotate(25 73 74)" />
        <ellipse cx="68" cy="86" rx="6" ry="2.8" transform="rotate(25 68 86)" />
        <ellipse cx="65" cy="99" rx="6" ry="3" transform="rotate(20 65 99)" />
        <ellipse cx="64" cy="113" rx="6" ry="3" transform="rotate(15 64 113)" />
        <ellipse cx="65" cy="126" rx="5.5" ry="3" transform="rotate(10 65 126)" />
      </g>

      {/* Tangkai Daun / Kapas Hijau (Kanan) */}
      <g stroke="#166534" fill="#22c55e" strokeWidth="1">
        {/* Batang daun */}
        <path d="M 132,144 Q 154,108 128,66" fill="none" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" />
        {/* Daun-daun */}
        <circle cx="132" cy="72" r="4.2" fill="#15803d" />
        <circle cx="140" cy="80" r="4.5" fill="#16a34a" />
        <circle cx="148" cy="91" r="5" fill="#15803d" />
        <circle cx="151" cy="104" r="5.2" fill="#16a34a" />
        <circle cx="149" cy="118" r="5.2" fill="#15803d" />
        <circle cx="144" cy="131" r="4.8" fill="#16a34a" />
        <circle cx="138" cy="141" r="4.2" fill="#15803d" />
        {/* Daun cabang dalam */}
        <circle cx="127" cy="84" r="4" fill="#16a34a" />
        <circle cx="134" cy="97" r="4.5" fill="#15803d" />
        <circle cx="135" cy="111" r="4.8" fill="#16a34a" />
        <circle cx="134" cy="125" r="4.5" fill="#15803d" />
      </g>

      {/* Obor / Lidah Api Emas */}
      <g>
        {/* Api Utama */}
        <path
          d="M 100,64 C 94,80 91,88 91,102 C 91,108 94,112 100,112 C 106,112 109,108 109,102 C 109,88 106,80 100,64 Z"
          fill="#f59e0b"
          stroke="#b45309"
          strokeWidth="1.5"
        />
        {/* Inti Lidah Api Kuning Terang */}
        <path
          d="M 100,74 C 96,84 94,90 94,100 C 94,104 96,108 100,108 C 104,108 106,104 106,100 C 106,90 104,84 100,74 Z"
          fill="#fef08a"
        />
        {/* Dudukan Obor Hijau Segi Berlapis */}
        <polygon points="90,102 110,102 107,108 93,108" fill="#15803d" stroke="#14532d" strokeWidth="1" />
        <polygon points="87,108 113,108 110,114 90,114" fill="#166534" stroke="#14532d" strokeWidth="1" />
        <polygon points="84,114 116,114 113,120 87,120" fill="#15803d" stroke="#14532d" strokeWidth="1" />
      </g>

      {/* Buku Terbuka Hijau (Lambang Pendidikan & Ilmu Pengetahuan) */}
      <g stroke="#14532d" strokeWidth="2.5" strokeLinejoin="round" fill="#FFFFFF">
        {/* Lembar Halaman Kiri */}
        <path
          d="M 100,123 Q 80,117 65,120 L 59,146 Q 79,141 100,147 Z"
          fill="#FFFFFF"
          stroke="#15803d"
          strokeWidth="2.8"
        />
        {/* Lembar Halaman Kanan */}
        <path
          d="M 100,123 Q 120,117 135,120 L 141,146 Q 121,141 100,147 Z"
          fill="#FFFFFF"
          stroke="#15803d"
          strokeWidth="2.8"
        />

        {/* Lapisan Halaman Buku Bawah Kiri (Hijau Tua) */}
        <path
          d="M 100,147 Q 80,142 59,146 L 56,153 Q 78,148 100,154 Z"
          fill="#15803d"
        />
        {/* Lapisan Halaman Buku Bawah Kanan (Hijau Tua) */}
        <path
          d="M 100,147 Q 120,142 141,146 L 144,153 Q 122,148 100,154 Z"
          fill="#15803d"
        />

        {/* Pita Emas / Penanda Buku di Bagian Bawah */}
        <path
          d="M 85,152 Q 100,159 119,158 Q 112,165 95,164 Z"
          fill="#eab308"
          stroke="#ca8a04"
          strokeWidth="1.2"
        />
      </g>

      {/* Teks Melengkung Bawah: "SDN KAPUK 06 PAGI" (Warna Merah Bata / Oranye Tua) */}
      <text
        fill="#c2410c"
        fontSize="12.5"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="1.2"
      >
        <textPath href="#schoolArc" startOffset="50%" textAnchor="middle">
          SDN KAPUK 06 PAGI
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Lambang Jaya Raya DKI Jakarta (Khusus Kop Surat Resmi Sesuai Gambar 1)
 */
export const LogoJayaRayaDki: React.FC<{ className?: string; size?: string }> = ({
  className = '',
  size = 'w-20 h-20',
}) => {
  return (
    <svg
      className={`${size} drop-shadow-sm select-none ${className}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Lambang Jaya Raya DKI Jakarta"
    >
      {/* Perisai Segi Lima Luar Hitam Garis Ganda Khas Surat Dinas */}
      <path
        d="M 10,14 L 90,14 L 90,62 L 50,92 L 10,62 Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Garis batas perisai dalam */}
      <path
        d="M 15,19 L 85,19 L 85,60 L 50,86 L 15,60 Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Pita Teks Atas "JAYA RAYA" */}
      <text
        x="50"
        y="26"
        textAnchor="middle"
        fill="#000000"
        fontSize="7.5"
        fontWeight="900"
        fontFamily="serif"
        letterSpacing="0.8"
      >
        JAYA RAYA
      </text>
      <line x1="20" y1="28" x2="80" y2="28" stroke="#000000" strokeWidth="1" />

      {/* Gerbang Lengkung Monas */}
      <path
        d="M 32,74 V 44 C 32,34 68,34 68,44 V 74"
        fill="none"
        stroke="#000000"
        strokeWidth="2"
      />

      {/* Monumen Nasional (Monas) & Api Kemerdekaan */}
      {/* Lidah Api Monas */}
      <path
        d="M 50,33 C 48,39 46,41 46,45 C 46,47 48,49 50,49 C 52,49 54,47 54,45 C 54,41 52,39 50,33 Z"
        fill="#000000"
      />
      {/* Tiang Obelisk Monas */}
      <polygon points="48.5,49 51.5,49 52.5,67 47.5,67" fill="#000000" />
      {/* Cawan Pelataran Monas */}
      <polygon points="42,67 58,67 55,71 45,71" fill="#000000" />
      <rect x="40" y="71" width="20" height="3" fill="#000000" />

      {/* Padi & Kapas / Gelombang Air Bawah */}
      {/* Ombak air di bawah cawan */}
      <path
        d="M 36,78 Q 43,75 50,78 Q 57,81 64,78"
        fill="none"
        stroke="#000000"
        strokeWidth="1.4"
      />
      <path
        d="M 38,82 Q 44,79 50,82 Q 56,85 62,82"
        fill="none"
        stroke="#000000"
        strokeWidth="1.2"
      />

      {/* Ranting Padi Kiri */}
      <path
        d="M 28,68 C 24,56 26,44 32,36"
        fill="none"
        stroke="#000000"
        strokeWidth="1.5"
      />
      <circle cx="26" cy="46" r="1.8" fill="#000000" />
      <circle cx="25" cy="54" r="1.8" fill="#000000" />
      <circle cx="26" cy="62" r="1.8" fill="#000000" />

      {/* Ranting Kapas Kanan */}
      <path
        d="M 72,68 C 76,56 74,44 68,36"
        fill="none"
        stroke="#000000"
        strokeWidth="1.5"
      />
      <circle cx="74" cy="46" r="1.8" fill="#000000" />
      <circle cx="75" cy="54" r="1.8" fill="#000000" />
      <circle cx="74" cy="62" r="1.8" fill="#000000" />
    </svg>
  );
};
