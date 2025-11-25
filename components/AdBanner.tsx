import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  className?: string;
  style?: React.CSSProperties;
  slotId?: string; // Should be provided when manual units are created in AdSense
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string; // For In-feed ads
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  className = '', 
  style, 
  slotId = "1109009056", // Default to the user provided slot ID
  format = 'auto'
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initialized.current) return;

    try {
      // @ts-ignore
      const adsbygoogle = window.adsbygoogle || [];
      // @ts-ignore
      adsbygoogle.push({});
      initialized.current = true;
    } catch (e) {
      // Silent error handling for production safety
    }
  }, []);

  return (
    <div className={`ad-container bg-gray-800/20 overflow-hidden flex items-center justify-center text-gray-500 text-[10px] uppercase tracking-widest text-center border border-white/5 ${className}`} style={style}>
      <div className="w-full h-full relative">
        {/* AdSense Unit */}
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client="ca-pub-3768566268455535"
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        ></ins>
        
        {/* Placeholder Text (Visible only if ad doesn't load/fill) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            <span>Publicidade</span>
        </div>
      </div>
    </div>
  );
};