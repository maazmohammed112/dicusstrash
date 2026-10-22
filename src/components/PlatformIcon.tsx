import React from 'react';
import type { PlatformType } from '../types/stash';
import { Globe, FileText, ListChecks, MapPin, Paperclip, Camera, AtSign, Play, Music2, Code2, MessageCircle, Pin, Ghost, Send, BriefcaseBusiness, Users } from 'lucide-react';
import { PLATFORM_LABELS } from '../services/platformDetector';
interface PlatformIconProps { platform: PlatformType; size?: number; className?: string; color?: string; }
export const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, size = 18, className = '', color }) => {
  const props = { width: size, height: size, className: `platform-icon ${className}`, style: color ? { color } : undefined, 'aria-label': PLATFORM_LABELS[platform] || 'Website', role: 'img' };
  if (platform === 'facebook') return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h-3a4 4 0 0 0-4 4v4H5v4h3v6h4v-6h3l1-4h-4V7h3z" /></svg>;
  if (platform === 'x') return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h4l12 18h-4zM20 3l-7 8M11 14l-7 7" /></svg>;
  if (platform === 'whatsapp') return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a9 9 0 0 1-13.5 8L3 21l1.5-4.5A9 9 0 1 1 21 11.5Z"/><path d="M8 7c-2 4 2 8 6 9l2-2-3-2-1 1-2-2 1-1-2-3z"/></svg>;
  const icons: Record<string, typeof Globe> = { instagram: Camera, threads: AtSign, youtube: Play, spotify: Music2, github: Code2, reddit: MessageCircle, pinterest: Pin, maps: MapPin, location: MapPin, note: FileText, checklist: ListChecks, file: Paperclip, snapchat: Ghost, telegram: Send, linkedin: BriefcaseBusiness, tiktok: Music2, discord: Users };
  const Icon = icons[platform] || Globe;
  return <Icon size={size} strokeWidth={1.65} className={`platform-icon ${className}`} style={color ? { color } : undefined} aria-label={PLATFORM_LABELS[platform] || 'Website'} />;
};
