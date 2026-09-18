import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Target,
  Users,
  BarChart2,
  Zap,
  MapPin,
  Check,
  ChevronRight,
  ArrowRight,
  ArrowUp
} from "lucide-react";
import { LocationMap } from "./LocationMap";
import { Button } from "../../components/ui/button";

export interface LandingPageProps {
  onLogin: () => void;
  onRegister?: () => void;
  logoImg?: string;
  hqImg?: string;
}

export function LandingPage({ 
  onLogin, 
  onRegister,
  logoImg = "/culiat_logo.jpg", 
  hqImg = "/culiat_hq.jpg" 
}: LandingPageProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll listener for top reading progress bar and back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(progress);
      }
      setShowBackToTop(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll-triggered reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Smooth scroll helper
  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative bg-white text-gray-900 font-sans selection:bg-[#0d7d4d] selection:text-white">
      <style>{`
        html { 
          scroll-behavior: smooth; 
          scroll-padding-top: 5.5rem;
        }

        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Hover interaction for cards */
        .system-card {
          transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms cubic-bezier(0.16, 1, 0.3, 1), border-color 320ms ease;
        }
        .system-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
        }
        
        .icon-chip {
          transition: transform 300ms ease, background-color 300ms ease, color 300ms ease;
        }
        .system-card:hover .icon-chip {
          transform: scale(1.08);
          background-color: #0d7d4d;
          color: #ffffff;
        }
      `}</style>

      {/* Top Reading / Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] z-[70] transition-all duration-75 pointer-events-none bg-[#0d7d4d] shadow-[0_0_8px_#0d7d4d]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* 1. HEADER & HERO SECTION (DARK ELEGANT HERO MATCHING USER IMAGE 1) */}
      <div 
        className="relative text-white min-h-[92vh] flex flex-col bg-cover bg-center"
        style={{ backgroundImage: hqImg ? `url(${hqImg})` : 'none' }}
      >
        {/* Dark overlay over building */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#061c10]/92 via-[#061c10]/85 to-[#061c10]/95 backdrop-blur-[1.5px]" />

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Top Navbar */}
          <nav className="sticky top-0 z-50 w-full px-6 lg:px-12 h-20 flex items-center justify-between border-b border-white/10 bg-[#061c10]/85 backdrop-blur-xl transition-all">
            <div className="flex items-center gap-3.5">
              {logoImg ? (
                <img 
                  src={logoImg} 
                  alt="Barangay Culiat Seal" 
                  className="w-12 h-12 rounded-full object-cover bg-white ring-2 ring-white/20 shadow-md" 
                />
              ) : (
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-[#0d7d4d]">
                  Logo
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.18em] text-[#22c55e] uppercase">
                  Republic of the Philippines
                </span>
                <span className="font-display text-xl sm:text-2xl font-black leading-none tracking-tight text-white mt-0.5">
                  Barangay Culiat
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-white/70 mt-0.5">
                  Quezon City - Emergency Response System
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8 text-white/90 font-bold text-sm tracking-wide">
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, "features")}
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a 
                href="#roles" 
                onClick={(e) => scrollToSection(e, "roles")}
                className="hover:text-white transition-colors"
              >
                User Roles
              </a>
              <a 
                href="#map" 
                onClick={(e) => scrollToSection(e, "map")}
                className="hover:text-white transition-colors"
              >
                Location Map
              </a>
              <button 
                onClick={onLogin} 
                className="bg-[#0d7d4d] hover:bg-[#0b6a41] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Sign In</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </nav>

          {/* Hero Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-16 lg:py-24 text-center">
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center text-[10px] sm:text-xs uppercase font-extrabold tracking-[0.18em] text-[#4ade80] px-4 py-1.5 rounded-full mb-6 border border-[#22c55e]/30 bg-[#22c55e]/10 backdrop-blur-sm">
              Disaster Preparedness Training & Simulation System
            </div>
            
            {/* Main Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6 drop-shadow-md">
              Learn to Help.<br />
              Be Ready to<br />
              Respond.
            </h1>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
              Get the training you need to keep your community safe. Simple, clear lessons. Real-world practice. Everything a disaster response team needs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={onRegister || onLogin} 
                className="bg-[#0d7d4d] hover:bg-[#0b6a41] text-white text-sm font-bold px-7 py-3 rounded-full shadow-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started Today</span>
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={(e) => scrollToSection(e, "features")} 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold px-7 py-3 rounded-full backdrop-blur-sm shadow-md transition-all hover:scale-[1.02]"
              >
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FEATURES SECTION ("What You'll Learn and Do") - CLEAN PURE WHITE (MATCHING USER IMAGE 2) */}
      <section id="features" className="py-24 sm:py-32 relative scroll-mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="text-[11px] uppercase font-extrabold tracking-[0.18em] text-[#0d7d4d] mb-3">
              Core Capabilities
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-black mb-4 text-gray-950">
              What You'll Learn and Do
            </h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto text-gray-500 font-normal">
              Everything your team needs to be prepared and confident when it matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="icon-chip size-12 rounded-2xl bg-emerald-50 text-[#0d7d4d] flex items-center justify-center mb-6">
                <BookOpen size={22} />
              </div>
              <h3 className="font-display text-lg font-black mb-2 text-gray-950">Easy-to-Follow Lessons</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-500">
                Clear, step-by-step training that covers everything you need to know about safety, teamwork, and what to do in an emergency.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="icon-chip size-12 rounded-2xl bg-emerald-50 text-[#0d7d4d] flex items-center justify-center mb-6">
                <Target size={22} />
              </div>
              <h3 className="font-display text-lg font-black mb-2 text-gray-950">Practice Scenarios</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-500">
                Real-world practice that prepares you for what might happen. Learn by doing, in a safe training environment.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="icon-chip size-12 rounded-2xl bg-emerald-50 text-[#0d7d4d] flex items-center justify-center mb-6">
                <Users size={22} />
              </div>
              <h3 className="font-display text-lg font-black mb-2 text-gray-950">Track Your Progress</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-500">
                See what you've learned, what you're working on, and how your team is doing. Simple, easy to understand.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="icon-chip size-12 rounded-2xl bg-emerald-50 text-[#0d7d4d] flex items-center justify-center mb-6">
                <BarChart2 size={22} />
              </div>
              <h3 className="font-display text-lg font-black mb-2 text-gray-950">Know Where You Stand</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-500">
                Clear reports show what skills are strong and where to focus next. Helps everyone improve together.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="icon-chip size-12 rounded-2xl bg-emerald-50 text-[#0d7d4d] flex items-center justify-center mb-6">
                <Zap size={22} />
              </div>
              <h3 className="font-display text-lg font-black mb-2 text-gray-950">Stay Informed</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-500">
                Get simple, clear messages about new training, important updates, and what's happening in your team.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="icon-chip size-12 rounded-2xl bg-emerald-50 text-[#0d7d4d] flex items-center justify-center mb-6">
                <MapPin size={22} />
              </div>
              <h3 className="font-display text-lg font-black mb-2 text-gray-950">Know Where Everyone Is</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-500">
                See where team members are located. Helpful for training exercises and coordinating when it matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ROLES SECTION ("For Everyone on Your Team") - PURE WHITE (MATCHING USER IMAGE 3) */}
      <section id="roles" className="py-24 sm:py-32 relative scroll-mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 reveal-on-scroll">
            <div className="text-[11px] uppercase font-extrabold tracking-[0.18em] text-[#0d7d4d] mb-3">
              Access Levels
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-black mb-4 text-gray-950">
              For Everyone on Your Team
            </h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto text-gray-500 font-normal">
              Whether you're learning, leading, or managing—the system works the way you do.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Responders Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 flex flex-col h-full border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="inline-block px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider text-[10px] mb-6 self-start bg-emerald-50 text-[#0d7d4d] border border-emerald-200/60">
                Team Members
              </div>
              <h3 className="font-display text-2xl font-black mb-3 text-gray-950">Responders</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed mb-8 flex-grow text-gray-500">
                Your training, your way. Do your lessons, track your progress, and practice real scenarios.
              </p>
              <ul className="space-y-4 text-xs sm:text-sm font-bold mt-auto text-gray-800">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Your assigned lessons</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Complete your training</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>See how you're doing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Get tips to improve</span>
                </li>
              </ul>
            </div>

            {/* Trainers & Supervisors Card (Accent Card with Green Top Border) */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 flex flex-col h-full border border-gray-200/80 border-t-4 border-t-[#0d7d4d] shadow-[0_6px_25px_rgba(0,0,0,0.06)] hover:shadow-2xl transition-all system-card reveal-on-scroll">
              <div className="inline-block px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider text-[10px] mb-6 self-start bg-emerald-50 text-[#0d7d4d] border border-emerald-200/60">
                Coordinators
              </div>
              <h3 className="font-display text-2xl font-black mb-3 text-gray-950">Trainers & Supervisors</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed mb-8 flex-grow text-gray-500">
                Create lessons, watch your team's progress, and make sure everyone is ready.
              </p>
              <ul className="space-y-4 text-xs sm:text-sm font-bold mt-auto text-gray-800">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Build new training lessons</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Create practice scenarios</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>See how your team is doing</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Print reports for records</span>
                </li>
              </ul>
            </div>

            {/* Leadership Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 flex flex-col h-full border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all system-card reveal-on-scroll">
              <div className="inline-block px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider text-[10px] mb-6 self-start bg-emerald-50 text-[#0d7d4d] border border-emerald-200/60">
                Leadership
              </div>
              <h3 className="font-display text-2xl font-black mb-3 text-gray-950">Managers & Directors</h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed mb-8 flex-grow text-gray-500">
                Full control of everything. Manage people, see reports, and make sure the system runs smoothly.
              </p>
              <ul className="space-y-4 text-xs sm:text-sm font-bold mt-auto text-gray-800">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Add or remove team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Set system options</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>See the big picture</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0d7d4d] text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>Access all reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA BANNER (MATCHING USER IMAGE 4) */}
      <section 
        id="get-started" 
        className="py-24 sm:py-32 relative overflow-hidden flex flex-col items-center text-center bg-[#0d7d4d] text-white"
      >
        <div className="relative max-w-4xl mx-auto px-6 z-10 reveal-on-scroll">
          <h2 className="font-display text-4xl sm:text-6xl font-black mb-6">
            Ready? Let's Get Started.
          </h2>
          <p className="text-base sm:text-lg mb-10 max-w-2xl mx-auto text-emerald-100 font-medium leading-relaxed">
            Hundreds of responders are already training. Join your team and be ready to help when it counts.
          </p>
          <button 
            onClick={onRegister || onLogin}
            className="bg-white text-[#0d7d4d] hover:bg-gray-100 text-sm font-bold px-9 py-3.5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <span>Start Your Training Now</span>
          </button>
        </div>
      </section>

      {/* 5. OFFICIAL FOOTER (WITH LOCATION MAP) */}
      <footer id="map" className="py-20 bg-[#061c10] text-gray-400">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-start">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {logoImg && (
                    <img 
                      src={logoImg} 
                      alt="Barangay Culiat Seal" 
                      className="w-12 h-12 rounded-full object-cover bg-white ring-2 ring-white/20 shadow-md" 
                    />
                  )}
                  <div>
                    <div className="font-display font-black text-xl text-white">Barangay Culiat</div>
                    <span className="text-[11px] font-medium text-white/60">Quezon City · Emergency Response System</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md leading-relaxed">
                  Emergency Response and Disaster Preparedness Training System (DPTSS). Equipping frontline responders, supervisors, and community leaders with mission-ready emergency skills.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-8 text-xs font-bold pt-6 border-t border-white/10">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] mb-4 text-[#22c55e]">Product</h4>
                  <ul className="space-y-3 text-gray-400 font-medium">
                    <li><a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-white transition-colors">Features</a></li>
                    <li><a href="#roles" onClick={(e) => scrollToSection(e, "roles")} className="hover:text-white transition-colors">Training</a></li>
                    <li><a href="#roles" onClick={(e) => scrollToSection(e, "roles")} className="hover:text-white transition-colors">Simulations</a></li>
                    <li><a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-white transition-colors">Analytics</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] mb-4 text-[#22c55e]">Organization</h4>
                  <ul className="space-y-3 text-gray-400 font-medium">
                    <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] mb-4 text-[#22c55e]">Legal</h4>
                  <ul className="space-y-3 text-gray-400 font-medium">
                    <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
              <LocationMap className="shadow-2xl border border-white/15" />
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500">
            <div>© 2026 DPTSS. Disaster Preparedness Training & Simulation System.</div>
            <div className="flex items-center gap-2 text-gray-400">
              System Status: <span className="flex items-center gap-1.5 text-[#22c55e] font-bold"><span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Scroll-to-Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-[#0d7d4d] text-white shadow-xl hover:bg-[#0b6a41] flex items-center justify-center transition-all duration-300 ${
          showBackToTop 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp size={18} className="stroke-[2.5]" />
      </button>
    </div>
  );
}

export default LandingPage;
