import React from 'react';

interface LocationMapProps {
  /** Paste your Google Maps embed src URL here */
  mapEmbedUrl?: string;
  /** Address name for the Get Directions link */
  destinationQuery?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  // ✅ Updated mapEmbedUrl with exact coordinates (14.66799467796346, 121.05665698232009) and street-level zoom (&z=1)
  mapEmbedUrl = "https://maps.google.com/maps?q=14.66799467796346, 121.05665698232009+(Culiat+Barangay+Hall)&z=17&output=embed",
  destinationQuery = "Culiat Barangay Hall"
}) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;

  return (
    <div className="bg-[#0b5d3a] text-white p-6 rounded-2xl max-w-xl w-full shadow-lg font-sans">
      {/* Title */}
      <h2 className="text-xl font-bold mb-4 tracking-wide">Location Map</h2>

      {/* Map Embed Container */}
      <div className="rounded-xl overflow-hidden shadow-inner bg-gray-200">
        <iframe
          title="Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="250"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[250px] block"
        />
      </div>

      {/* Footer / Info Section */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-emerald-100 max-w-xs leading-relaxed">
          Visit our barangay hall for in-person services and assistance.
        </p>

        {/* Get Directions Button */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-white text-[#0b5d3a] px-5 py-3 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm shrink-0"
        >
          {/* Location Pin Icon */}
          <svg
            className="w-5 h-5 text-[#0b5d3a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-left leading-tight">
            Get<br />Directions
          </span>
        </a>
      </div>
    </div>
  );
};

export default LocationMap;