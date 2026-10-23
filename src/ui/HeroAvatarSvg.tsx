import React from 'react';
import { HeroId, HeroSkillInfo } from '../types/game';

export const HeroFacePortrait: React.FC<{ heroId: HeroId; className?: string }> = ({
  heroId,
  className = 'w-11 h-11',
}) => {
  if (heroId === 'vanguard') {
    // Crimson horned greathelm face
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="8" fill="#1E1418" />
        <path d="M10 14L17 20V36L24 41L31 36V20L38 14L33 10H15L10 14Z" fill="#334155" stroke="#EF4444" strokeWidth="2" />
        <path d="M22 6H26V22H22V6Z" fill="#DC2626" />
        <rect x="15" y="22" width="18" height="4" rx="1" fill="#FF2E4C" />
        <path d="M18 30L24 35L30 30" stroke="#94A3B8" strokeWidth="2" />
      </svg>
    );
  }
  if (heroId === 'arcanist') {
    // Mystic hooded mage face with glowing purple eyes & crown
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="8" fill="#171126" />
        <path d="M24 5L38 22L33 41H15L10 22L24 5Z" fill="#3B0764" stroke="#A855F7" strokeWidth="2" />
        <circle cx="24" cy="26" r="9" fill="#1E1B4B" />
        <rect x="17" y="24" width="5" height="3" rx="1" fill="#D8B4FE" />
        <rect x="26" y="24" width="5" height="3" rx="1" fill="#D8B4FE" />
        <polygon points="24,11 27,17 24,20 21,17" fill="#F59E0B" />
      </svg>
    );
  }
  if (heroId === 'ranger') {
    // Sylvan emerald hood & visor face
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="8" fill="#0F221B" />
        <path d="M24 6L37 20L34 40H14L11 20L24 6Z" fill="#065F46" stroke="#10B981" strokeWidth="2" />
        <path d="M16 23H32L29 35H19L16 23Z" fill="#1E293B" />
        <path d="M17 24L22 26L17 27Z" fill="#34D399" />
        <path d="M31 24L26 26L31 27Z" fill="#34D399" />
        <path d="M28 8L37 4L33 15" fill="#34D399" />
      </svg>
    );
  }
  if (heroId === 'wraith') {
    // Phantom masked assassin/support face with glowing diamond sigil
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="8" fill="#121324" />
        <path d="M12 14L24 7L36 14L33 39L24 43L15 39L12 14Z" fill="#18181B" stroke="#6366F1" strokeWidth="2" />
        <polygon points="24,15 32,25 24,35 16,25" fill="#312E81" stroke="#818CF8" strokeWidth="1.5" />
        <circle cx="24" cy="25" r="3.5" fill="#A5B4FC" />
      </svg>
    );
  }
  // Colossus: Monolith stone golem face with glowing cyan crystal visor
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="8" fill="#0F1B29" />
      <polygon points="14,9 34,9 40,22 35,40 13,40 8,22" fill="#475569" stroke="#38BDF8" strokeWidth="2" />
      <rect x="14" y="21" width="20" height="5" rx="1.5" fill="#7DD3FC" />
      <polygon points="24,10 28,17 20,17" fill="#0284C7" />
    </svg>
  );
};

export const SkillIconSvg: React.FC<{
  iconType: HeroSkillInfo['iconType'];
  color: string;
  className?: string;
}> = ({ iconType, color, className = 'w-6 h-6' }) => {
  switch (iconType) {
    case 'sword':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'slam':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
          <path d="M12 3v12M8 11l4 4 4-4" />
        </svg>
      );
    case 'orb':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <circle cx="12" cy="12" r="6" fill={color} fillOpacity="0.25" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'blink':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'nova':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" />
        </svg>
      );
    case 'arrows':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M5 19L19 5M19 5H12M19 5V12" />
          <path d="M3 14L14 3" />
          <path d="M10 21L21 10" />
        </svg>
      );
    case 'wind':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
        </svg>
      );
    case 'snipe':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
    case 'daggers':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M4 20L20 4M4 4l16 16" />
        </svg>
      );
    case 'heal':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
          <rect x="3" y="3" width="18" height="18" rx="4" />
        </svg>
      );
    case 'sanctuary':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'spikes':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <polygon points="12,3 16,19 8,19" />
          <polygon points="5,9 9,19 2,19" />
          <polygon points="19,9 22,19 15,19" />
        </svg>
      );
    case 'bulwark':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      );
    case 'meteor':
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
          <circle cx="9" cy="15" r="5" fill={color} fillOpacity="0.3" />
          <path d="M14 10l7-7M11 6l6-4M18 13l4-6" />
        </svg>
      );
  }
};
