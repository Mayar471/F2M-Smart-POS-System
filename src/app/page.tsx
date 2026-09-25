import { Clock, Settings, ShieldCheck, BarChart2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: '#0F0C03' }}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(/background.jpeg)',
          zIndex: 0
        }}
      />
      
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top Bar */}
        <header className="shrink-0 px-6 sm:px-8 lg:px-12 flex items-center justify-between" style={{ height: '60px', minHeight: '60px' }}>
          <span className="text-white/70 text-sm">مدينة النبك</span>
          <span className="text-white text-sm font-medium tracking-wide">F2M BURGER</span>
        </header>

        {/* Hero Center */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 lg:px-12 text-center">
          {/* Brand Logo */}
          <div className="mb-6">
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold mb-2" style={{ color: 'var(--brand-primary, #C9A84C)' }}>
              F2M
            </h1>
            <p className="text-3xl sm:text-4xl md:text-5xl text-white tracking-widest font-light">
              BURGER
            </p>
          </div>

          {/* Tagline */}
          <p className="text-white/80 text-lg mb-4 max-w-2xl" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
            وجهة عشاق البرجر الأصيل في مدينة النبك
          </p>

          {/* Description */}
          <p className="text-white/60 text-sm mb-12 max-w-xl leading-relaxed" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
            نقدم يومياً أشهى البرجر بمكونات طازجة
            <br />
            وخدمة سريعة تليق بك
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/pos"
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: 'var(--brand-primary, #C9A84C)' }}
            >
              <Clock className="w-5 h-5" />
              بدء وردية العمل
            </Link>
            <Link
              href="/login?role=manager"
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold border-2 border-white transition-all duration-200 hover:bg-white hover:text-gray-900"
              style={{ backgroundColor: 'transparent' }}
            >
              <Settings className="w-5 h-5" />
              لوحة الإدارة
            </Link>
          </div>
        </div>

        {/* Feature Strip */}
        <div className="shrink-0 px-6 sm:px-8 lg:px-12 pb-8">
          <div className="flex items-center justify-center gap-8 sm:gap-16">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
              <span className="text-white/70 text-sm">سرعة في الخدمة</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
              <span className="text-white/70 text-sm">رقابة مالية دقيقة</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
              <span className="text-white/70 text-sm">تقارير فورية</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <footer className="shrink-0 flex items-center justify-center px-6 py-3">
          <p className="text-white/40 text-xs">
            © 2026 F2M Burger — جميع الحقوق محفوظة
          </p>
        </footer>
      </div>
    </div>
  );
}
