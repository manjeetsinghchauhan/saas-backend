import * as fs from 'fs';
import * as path from 'path';

// Load language files
const enLang = JSON.parse(fs.readFileSync(path.join(__dirname, '../lang/en.json'), 'utf8'));
const hiLang = JSON.parse(fs.readFileSync(path.join(__dirname, '../lang/hi.json'), 'utf8'));

const languages: { [key: string]: any } = {
  en: enLang,
  hi: hiLang,
};

// Function for simple translations (used by auth)
export function t(key: string, lang: string = 'en'): string {
  const langData = languages[lang] || languages.en;
  const keys = key.split('.');
  let value: any = langData;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Function for template-based translations (used by projects)
export function __(key: string, options?: any): string {
  const lang = 'en'; // Default language
  const langData = languages[lang] || languages.en;
  const keys = key.split('.');
  let value: any = langData;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  if (typeof value === 'string' && options) {
    // Simple template replacement
    return value.replace(/\{(\w+)\}/g, (match: string, key: string) => {
      return options[key] || match;
    });
  }
  
  return typeof value === 'string' ? value : key;
}

// Default export with both functions
export default { t, __ }; 