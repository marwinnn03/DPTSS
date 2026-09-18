import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface LocationMapProps {
  /** Paste your Google Maps embed src URL here */
  mapEmbedUrl?: string;
  /** Address name for the Get Directions link */
  destinationQuery?: string;
  className?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  // ✅ Updated mapEmbedUrl with exact coordinates (14.66799467796346, 121.05665698232009) and street-level zoom (&z=17)
  mapEmbedUrl = "https://maps.google.com/maps?q=14.66799467796346, 121.05665698232009+(Culiat+Barangay+Hall)&z=17&output=embed",
  destinationQuery = "Culiat Barangay Hall",
  className = ""
}) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;

  return (
    <div 
      className={`relative overflow-hidden text-white p-6 sm:p-7 rounded-3xl max-w-xl w-full border border-white/15 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/25 ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(10, 36, 21, 0.92) 0%, rgba(4, 18, 10, 0.96) 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        fontFamily: "'Manrope', sans-serif"
      }}
    >
      {/* Subtle emerald ambient glow behind header */}
      <div 
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ backgroundColor: 'oklch(0.47 0.145 150)' }}
      />

      {/* Header Info */}
      <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div>
          <span 
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] block mb-1"
            style={{ color: 'oklch(0.76 0.155 148)' }}
          >
            Barangay Headquarters
          </span>
          <h3 
            className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <MapPin size={22} className="text-[oklch(0.76_0.155_148)] shrink-0" />
            <span>Location Map</span>
          </h3>
        </div>

        <span 
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-white/10 bg-white/5 text-white/80"
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.76 0.155 148)' }} />
          QC District 6
        </span>
      </div>

      {/* Map Embed Container with matching border & radius */}
      <div className="relative z-10 rounded-2xl overflow-hidden border border-white/15 shadow-inner bg-[#04120a]/80">
        <iframe
          title="Culiat Barangay Hall Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="240"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[240px] block"
        />
      </div>

      {/* Footer / Directions Action */}
      <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-xs">
          <span className="font-semibold text-white block">Culiat Barangay Hall</span>
          Tandang Sora Ave, Quezon City · In-person assistance & operations
        </div>

        {/* Get Directions Button matching LandingPage primary buttons */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-95 shrink-0"
          style={{
            backgroundColor: 'oklch(0.47 0.145 150)',
            boxShadow: '0 8px 20px -4px rgba(27, 94, 32, 0.45)'
          }}
        >
          <Navigation size={16} className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span>Get Directions</span>
          <ExternalLink size={14} className="opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
};

export default LocationMap;