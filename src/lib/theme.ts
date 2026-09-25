import { db } from '@/db';

export interface ExtractedPalette {
  primaryColor:   string;
  secondaryColor: string;
  accentColor:    string;
  textOnPrimary:  string;
}

// TODO: Implement logo color extraction once node-vibrant import is fixed
// and brandTheme table is added to schema
export async function extractPaletteFromLogo(logoPath: string): Promise<ExtractedPalette> {
  // Return default colors for now
  return {
    primaryColor: '#BA7517',
    secondaryColor: '#1D9E75',
    accentColor: '#7F77DD',
    textOnPrimary: '#FAEEDA',
  };
}

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getThemeCssVars(theme: {
  primaryColor: string; secondaryColor: string;
  accentColor: string;  textOnPrimary: string;
}): string {
  return `
    --brand-primary: ${theme.primaryColor};
    --brand-secondary: ${theme.secondaryColor};
    --brand-accent: ${theme.accentColor};
    --brand-text-on-primary: ${theme.textOnPrimary};
  `.trim();
}

export async function getStoredTheme() {
  // For now, return default theme since brandTheme table doesn't exist yet
  // This will be updated once we add the brandTheme table to schema
  return {
    primaryColor: '#BA7517',
    secondaryColor: '#1D9E75',
    accentColor: '#7F77DD',
    textOnPrimary: '#FAEEDA',
    logoUrl: '',
  };
}
