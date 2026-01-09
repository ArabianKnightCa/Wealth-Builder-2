// Settings constants - shared across all settings sections

export const AVATAR_OPTIONS = [
  "👦", "👧", "👨", "👩", "🧒", "👶",
  "🦁", "🐻", "🐼", "🐨", "🦊", "🐸",
  "⭐", "🌟", "💫", "🎯", "🎨", "📚",
  "🚀", "🌈", "🎓", "💼", "🏠", "🌱"
];

export const LIFE_STAGE_OPTIONS = [
  { value: 'ES', label: 'Elementary School' },
  { value: 'JH', label: 'Junior High' },
  { value: 'HS', label: 'High School' },
  { value: 'CL', label: 'College' },
  { value: 'UN', label: 'University' },
  { value: 'AD', label: 'Adult / Non-Student' }
];

export const OCCUPATION_OPTIONS = [
  'Student',
  'Full-Time Employee',
  'Part-Time Employee',
  'Self-Employed',
  'Business Owner',
  'Freelancer',
  'Unemployed',
  'Retired',
  'Homemaker',
  'Other'
];

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
];

export const FONT_OPTIONS = [
  { value: 'default', label: 'System Default', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'inter', label: 'Inter', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'georgia', label: 'Georgia (Serif)', style: 'font-serif', preview: 'Aa Bb Cc 123' },
  { value: 'times', label: 'Times New Roman', style: 'font-serif', preview: 'Aa Bb Cc 123' },
  { value: 'arial', label: 'Arial', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'verdana', label: 'Verdana', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'courier', label: 'Courier (Monospace)', style: 'font-mono', preview: 'Aa Bb Cc 123' },
  { value: 'comic', label: 'Comic Sans', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'dyslexic', label: 'OpenDyslexic', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'roboto', label: 'Roboto', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'lato', label: 'Lato', style: 'font-sans', preview: 'Aa Bb Cc 123' },
  { value: 'merriweather', label: 'Merriweather (Serif)', style: 'font-serif', preview: 'Aa Bb Cc 123' }
];

export const EXPERIENCE_LEVELS = [
  { value: 1, label: 'Beginner - Just starting' },
  { value: 2, label: 'Novice - Know some basics' },
  { value: 3, label: 'Intermediate - Comfortable with basics' },
  { value: 4, label: 'Advanced - Strong knowledge' },
  { value: 5, label: 'Expert - Deep understanding' }
];

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic - العربية' },
  { code: 'es', name: 'Spanish - Español' },
  { code: 'zh', name: 'Mandarin - 中文' },
  { code: 'yue', name: 'Cantonese - 廣東話' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'vi', name: 'Vietnamese - Tiếng Việt' },
  { code: 'ko', name: 'Korean - 한국어' },
  { code: 'fr', name: 'French - Français' },
  { code: 'de', name: 'German - Deutsch' },
  { code: 'ru', name: 'Russian - Русский' },
  { code: 'pt', name: 'Portuguese - Português' },
  { code: 'ja', name: 'Japanese - 日本語' },
  { code: 'hi', name: 'Hindi - हिन्दी' },
  { code: 'it', name: 'Italian - Italiano' }
];

export const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'display', label: 'Display', icon: '🎨' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'privacy', label: 'Privacy', icon: '🛡️' },
  { id: 'parental', label: 'Parental Controls', icon: '👨‍👩‍👧' },
  { id: 'danger', label: 'Account Actions', icon: '⚙️' }
];

// Helper functions
export const getLifeStageLabel = (value) => {
  const option = LIFE_STAGE_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value;
};

export const getExperienceLabel = (value) => {
  const level = EXPERIENCE_LEVELS.find(l => l.value === value);
  return level ? level.label.split(' - ')[0] : `Level ${value}`;
};
