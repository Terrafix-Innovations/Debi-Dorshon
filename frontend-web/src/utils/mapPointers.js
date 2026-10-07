/**
 * Dynamic SVG Vector Pointers for MapLibre
 * Based on map-numbered-pointer.svg
 * Supports dynamic numbering (1, 2, 3...), active selection states, and S/Destination variants.
 */

export function getNumberedPointerSvg(number, isActive = false) {
  const numStr = String(number);
  const fontSize = numStr.length > 2 ? 11 : numStr.length > 1 ? 13 : 15;

  return `
    <div class="vector-pointer-wrapper cursor-pointer transition-all duration-300 relative flex items-center justify-center ${
      isActive ? 'scale-125 -translate-y-1.5 filter drop-shadow-[0_8px_16px_rgba(243,61,75,0.45)] z-50' : 'hover:scale-110 hover:-translate-y-0.5 z-40'
    }" style="width: 54px; height: 54px;">
      <img src="/durga-map-pointer-transparent.svg" alt="Pandal Marker" class="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md" />
      <span class="relative z-10 font-bold text-white flex items-center justify-center" 
            style="font-size: ${fontSize}px; text-shadow: 0px 1px 3px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,0.8); font-family: 'Plus Jakarta Sans',Inter,Arial,sans-serif; width: 22px; height: 22px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: -12px;">
        ${numStr}
      </span>
    </div>
  `;
}

export function getPandalPointerSvg(isActive = false) {
  return `
    <div class="vector-pointer-wrapper cursor-pointer transition-all duration-300 relative flex items-center justify-center ${
      isActive ? 'scale-125 -translate-y-1.5 filter drop-shadow-[0_8px_16px_rgba(243,61,75,0.45)] z-50' : 'hover:scale-110 hover:-translate-y-0.5 z-40'
    }" style="width: 54px; height: 54px;">
      <img src="/durga-map-pointer-transparent.svg" alt="Pandal Marker" class="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md" />
    </div>
  `;
}

export function getStartPointerSvg() {
  return `
    <div class="vector-pointer-wrapper cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-0.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 64 80">
        <defs>
          <linearGradient id="p-start" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4ADE80"/>
            <stop offset=".55" stop-color="#16A34A"/>
            <stop offset="1" stop-color="#15803D"/>
          </linearGradient>
          <filter id="s-start">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity=".28"/>
          </filter>
        </defs>
        <ellipse cx="32" cy="72" rx="17" ry="4" fill="#16A34A" opacity=".25"/>
        <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-start)" filter="url(#s-start)"/>
        <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#DCFCE7" stroke-width="3"/>
        <text x="32" y="36.5" text-anchor="middle" font-family="'Plus Jakarta Sans',Inter,Arial,sans-serif" font-size="18" font-weight="800" fill="#DCFCE7">S</text>
      </svg>
    </div>
  `;
}

export function getDestPointerSvg() {
  return `
    <div class="vector-pointer-wrapper cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-0.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 64 80">
        <defs>
          <linearGradient id="p-dest" x1="18" y1="8" x2="50" y2="60" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FB7185"/>
            <stop offset=".55" stop-color="#E11D48"/>
            <stop offset="1" stop-color="#9F1239"/>
          </linearGradient>
          <filter id="s-dest">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity=".3"/>
          </filter>
        </defs>
        <ellipse cx="32" cy="72" rx="17" ry="4" fill="#E11D48" opacity=".25"/>
        <path d="M32 3C16.54 3 4 15.54 4 31c0 20.2 28 44 28 44s28-23.8 28-44C60 15.54 47.46 3 32 3Z" fill="url(#p-dest)" filter="url(#s-dest)"/>
        <circle cx="32" cy="30" r="17" fill="#18202B" stroke="#FFE4E6" stroke-width="3"/>
        <text x="32" y="36.5" text-anchor="middle" font-family="'Plus Jakarta Sans',Inter,Arial,sans-serif" font-size="16" font-weight="800" fill="#FFE4E6">📍</text>
      </svg>
    </div>
  `;
}

export function getClusterPointerSvg(count) {
  const numStr = String(count);
  const fontSize = numStr.length > 2 ? 26 : numStr.length > 1 ? 28 : 34;
  const yPos = numStr.length > 2 ? 58 : 59;
  
  // Scale the entire SVG depending on how many points
  const scale = count < 10 ? 0.7 : count < 50 ? 0.85 : 1;
  const size = Math.round(96 * scale);

  return `
    <div class="vector-cluster-wrapper cursor-pointer transition-all duration-300 hover:scale-110 z-20 flex items-center justify-center filter drop-shadow-md" style="width: ${size}px; height: ${size}px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="cluster-bg-${count}" x1="18" y1="8" x2="78" y2="88" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFB52E"/>
            <stop offset=".52" stop-color="#FF6B2C"/>
            <stop offset="1" stop-color="#F33D4B"/>
          </linearGradient>
          <filter id="cluster-shadow-${count}" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".28"/>
          </filter>
        </defs>
        <circle cx="48" cy="48" r="43" fill="#FF6B3D" opacity=".16"/>
        <circle cx="48" cy="48" r="38" fill="url(#cluster-bg-${count})" filter="url(#cluster-shadow-${count})"/>
        <circle cx="48" cy="48" r="34" fill="#18202B" stroke="#FFF4E8" stroke-width="3"/>
        <text x="48" y="${yPos}" text-anchor="middle" font-family="'Plus Jakarta Sans',Inter,Arial,sans-serif" font-size="${fontSize}" font-weight="800" fill="#FFF4E8">${numStr}</text>
      </svg>
    </div>
  `;
}
