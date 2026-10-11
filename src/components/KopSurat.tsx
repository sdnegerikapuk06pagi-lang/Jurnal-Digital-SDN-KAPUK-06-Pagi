import React from 'react';
import { SchoolSettings } from '../types';

interface KopSuratProps {
  settings?: SchoolSettings;
  className?: string;
}

/**
 * Kop Surat Resmi SDN KAPUK 06 PAGI
 * Format Teks Dinas Resmi (Tanpa Logo sesuai instruksi):
 * - PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
 * - DINAS PENDIDIKAN
 * - SDN KAPUK 06 PAGI
 * - Jalan Tenis Raya Rt 011 Rw 14 Kapuk, Cengkareng - Jakarta Barat
 * - Email : sdnkapuk06pagi@gmail.com    Kode Pos 11720
 * - Garis Pembatas Ganda Kop Dinas (Tebal - Tipis)
 */
export const KopSurat: React.FC<KopSuratProps> = ({ settings, className = '' }) => {
  const namaSekolah = settings?.namaSekolah || 'SDN KAPUK 06 PAGI';
  const alamatKop = settings?.alamat || 'Jalan Tenis Raya Rt 011 Rw 14 Kapuk, Cengkareng - Jakarta Barat';
  const emailKop = settings?.email || 'sdnkapuk06pagi@gmail.com';
  const kodePosKop = settings?.kodePos || '11720';
  const logoUrl = settings?.logoUrl || 'https://i.imgur.com/GlCn0x3.png';

  return (
    <div className={`w-full mb-6 text-black select-none ${className}`}>
      <div className="pb-2 flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo Sekolah SDN Kapuk 06 Pagi */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
          <img
            src={logoUrl}
            alt="Logo SDN Kapuk 06 Pagi"
            className="w-full h-full object-contain drop-shadow-xs"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Teks Kop Surat Dinas Resmi Pemprov DKI Jakarta */}
        <div className="flex-1 text-center font-serif leading-tight px-1">
          <h3 className="text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wide text-black">
            PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
          </h3>
          <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-black mt-0.5">
            DINAS PENDIDIKAN
          </h2>
          <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight text-black mt-1">
            {namaSekolah}
          </h1>
          <p className="text-xs sm:text-sm font-sans text-black mt-1 leading-snug">
            {alamatKop}
          </p>
          <div className="flex items-center justify-between text-xs sm:text-sm font-sans text-black mt-0.5 px-4">
            <span className="invisible text-[10px]">11720</span>
            <p>
              Email : <span className="underline">{emailKop}</span>
            </p>
            <span className="font-sans font-semibold">{kodePosKop}</span>
          </div>
        </div>

        {/* Spacer Kanan agar Teks Tetap Simetris di Tengah */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 hidden sm:flex items-center justify-center invisible">
          <div className="w-full h-full"></div>
        </div>
      </div>

      {/* Garis Ganda Resmi Kop Dinas (Tebal di atas, tipis di bawah) */}
      <div className="border-b-[3.5px] border-black mt-1"></div>
      <div className="border-b-[1.5px] border-black mt-[2px]"></div>
    </div>
  );
};
