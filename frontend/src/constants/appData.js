// Love Languages data with full explanations
export const LOVE_LANGUAGES = [
    {
        id: 'words_of_affirmation',
        name: 'Words of Affirmation',
        shortDescription: 'Feels loved through praise and kind words',
        fullDescription: 'Feels most loved when receiving praise, encouragement, kind words, and verbal appreciation.',
        examples: ['Compliments', '"I\'m proud of you"', 'Positive feedback', 'Encouraging notes'],
        icon: 'MessageHeart'
    },
    {
        id: 'quality_time',
        name: 'Quality Time',
        shortDescription: 'Feels loved through focused attention',
        fullDescription: 'Feels most loved when receiving focused, undivided attention.',
        examples: ['Playing together', 'Talking without distractions', 'Shared activities', 'One-on-one time'],
        icon: 'Clock'
    },
    {
        id: 'receiving_gifts',
        name: 'Receiving Gifts',
        shortDescription: 'Feels loved through thoughtful gifts',
        fullDescription: 'Feels most loved when given thoughtful gifts that show effort or remembrance. Not about price.',
        examples: ['Small surprises', 'Handmade items', 'Meaningful keepsakes', 'Remembered favorites'],
        icon: 'Gift'
    },
    {
        id: 'acts_of_service',
        name: 'Acts of Service',
        shortDescription: 'Feels loved when others help them',
        fullDescription: 'Feels most loved when others help or do thoughtful things for them.',
        examples: ['Helping with homework', 'Making something for them', 'Fixing a problem', 'Taking care of chores'],
        icon: 'HandHelping'
    },
    {
        id: 'physical_touch',
        name: 'Physical Touch',
        shortDescription: 'Feels loved through appropriate touch',
        fullDescription: 'Feels most loved through appropriate physical connection. Always consent-aware.',
        examples: ['Hugs', 'High-fives', 'Cuddles', 'Sitting close', 'Pats on the back'],
        icon: 'Heart'
    }
];

// Music categories
export const MUSIC_CATEGORIES = [
    'Pop', 'Hip-Hop', 'Rap', 'R&B', 'Rock', 'Alternative', 'Indie', 'Jazz',
    'Classical', 'Country', 'EDM', 'K-Pop', 'Latin', 'Afrobeats', 'Soundtracks', 'Kids/Family'
];

// Dance styles
export const DANCE_STYLES = [
    'Hip-Hop', 'Ballet', 'Jazz', 'Contemporary', 'Breakdance',
    'Tap', 'Folk', 'Cultural/Traditional', 'Freestyle', 'Other'
];

// Learning styles
export const LEARNING_STYLES = [
    'Visual Learner',
    'Auditory Learner', 
    'Reading/Writing Learner',
    'Kinesthetic Learner',
    'Social Learner',
    'Solitary Learner',
    'Logical Learner',
    'Combination'
];

// Social styles
export const SOCIAL_STYLES = [
    'Very Outgoing',
    'Outgoing',
    'Balanced',
    'Reserved',
    'Very Reserved',
    'Situational'
];

// Birthday reminder options
export const BIRTHDAY_REMINDER_OPTIONS = [
    { value: 1, label: '1 day before' },
    { value: 3, label: '3 days before' },
    { value: 5, label: '5 days before' },
    { value: 7, label: '1 week before' },
    { value: 14, label: '2 weeks before' },
    { value: 21, label: '3 weeks before' },
    { value: 28, label: '4 weeks before' }
];

// Supported languages
export const APP_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'de', name: 'Deutsch' }
];

// Date formats
export const DATE_FORMATS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
];

// Export formats
export const EXPORT_FORMATS = [
    { value: 'pdf', label: 'PDF Document', icon: 'FileText' },
    { value: 'json', label: 'JSON Data', icon: 'FileJson' },
    { value: 'csv', label: 'CSV Spreadsheet', icon: 'Table' }
];
