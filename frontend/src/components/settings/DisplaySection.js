import React from 'react';
import { FONT_OPTIONS } from './constants';

const TEXT_SIZE_OPTIONS = [
  { value: 'small', label: 'A', class: 'text-sm' },
  { value: 'normal', label: 'A', class: 'text-base' },
  { value: 'large', label: 'A', class: 'text-lg' },
  { value: 'xlarge', label: 'A', class: 'text-xl' }
];

function DisplaySection({ display, setDisplay, labelClass, subTextClass, inputClass, setShowFontPicker }) {
  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">🎨 Display & Accessibility</h2>
        <p className={subTextClass}>Customize how the app looks</p>
      </div>

      {/* Dark Mode */}
      <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500' : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-lg">{display.dark_mode ? '🌙' : '☀️'} Dark Mode</span>
            <p className={`text-sm ${subTextClass}`}>Easier on the eyes at night</p>
          </div>
          <button
            onClick={() => setDisplay(prev => ({ ...prev, dark_mode: !prev.dark_mode }))}
            className={`w-16 h-9 rounded-full transition-all ${
              display.dark_mode ? 'bg-indigo-500' : 'bg-yellow-400'
            }`}
          >
            <div className={`w-7 h-7 bg-white rounded-full shadow transform transition-transform flex items-center justify-center text-sm ${
              display.dark_mode ? 'translate-x-8' : 'translate-x-1'
            }`}>
              {display.dark_mode ? '🌙' : '☀️'}
            </div>
          </button>
        </div>
      </div>

      {/* Text Size */}
      <div>
        <label className={`block font-semibold mb-2 ${labelClass}`}>📝 Text Size</label>
        <div className="flex gap-2">
          {TEXT_SIZE_OPTIONS.map(size => (
            <button
              key={size.value}
              onClick={() => setDisplay(prev => ({ ...prev, text_size: size.value }))}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition border-2 ${size.class} ${
                display.text_size === size.value
                  ? 'bg-gold text-navy-900 shadow-md border-yellow-500'
                  : display.dark_mode
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Style */}
      <div>
        <label className={`block font-semibold mb-2 ${labelClass}`}>🔤 Font Style</label>
        <button
          onClick={() => setShowFontPicker(true)}
          className={`w-full px-4 py-3 rounded-lg border-2 text-left flex justify-between items-center ${inputClass} hover:border-gold`}
        >
          <div>
            <span className="font-medium">{FONT_OPTIONS.find(f => f.value === display.font_family)?.label || 'System Default'}</span>
            <span className={`ml-3 ${FONT_OPTIONS.find(f => f.value === display.font_family)?.style || ''} ${subTextClass}`}>
              {FONT_OPTIONS.find(f => f.value === display.font_family)?.preview}
            </span>
          </div>
          <span className="text-gold">▼</span>
        </button>
        <p className={`text-xs mt-1 ${subTextClass}`}>OpenDyslexic recommended for users with dyslexia</p>
      </div>

      {/* Accessibility Toggles */}
      <div className="space-y-3">
        <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <span className="font-semibold">🎯 High Contrast</span>
            <p className={`text-sm ${subTextClass}`}>Increase contrast for better visibility</p>
          </div>
          <button
            onClick={() => setDisplay(prev => ({ ...prev, high_contrast: !prev.high_contrast }))}
            className={`w-14 h-8 rounded-full transition-colors ${
              display.high_contrast ? 'bg-gold' : 'bg-gray-400'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
              display.high_contrast ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <span className="font-semibold">✨ Reduce Animations</span>
            <p className={`text-sm ${subTextClass}`}>For users who prefer less motion</p>
          </div>
          <button
            onClick={() => setDisplay(prev => ({ ...prev, reduce_animations: !prev.reduce_animations }))}
            className={`w-14 h-8 rounded-full transition-colors ${
              display.reduce_animations ? 'bg-gold' : 'bg-gray-400'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
              display.reduce_animations ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisplaySection;
