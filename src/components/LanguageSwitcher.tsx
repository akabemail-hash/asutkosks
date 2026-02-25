import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Globe size={20} />
        <span className="uppercase">{i18n.language}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
          <button onClick={() => changeLanguage('az')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Azərbaycan</button>
          <button onClick={() => changeLanguage('en')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">English</button>
          <button onClick={() => changeLanguage('ru')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Русский</button>
          <button onClick={() => changeLanguage('tr')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Türkçe</button>
        </div>
      )}
    </div>
  );
}
