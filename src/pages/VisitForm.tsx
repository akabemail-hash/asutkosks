import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Upload, Search, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function VisitForm() {
  const { t } = useTranslation();
  const location = useLocation();
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [problemTypes, setProblemTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    kiosk_id: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    visit_type_id: '',
    problem_type_id: '',
    description: ''
  });

  // Set initial kiosk from navigation state
  useEffect(() => {
    if (location.state?.kiosk_id) {
      setFormData(prev => ({ ...prev, kiosk_id: location.state.kiosk_id.toString() }));
    }
  }, [location.state]);

  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Searchable dropdown state
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [kiosksRes, visitTypesRes, problemTypesRes] = await Promise.all([
        fetch('/api/kiosks?limit=0'),
        fetch('/api/visit-types'),
        fetch('/api/problem-types')
      ]);

      if (kiosksRes.ok) setKiosks((await kiosksRes.json()).data);
      if (visitTypesRes.ok) setVisitTypes(await visitTypesRes.json());
      if (problemTypesRes.ok) setProblemTypes(await problemTypesRes.json());
    } catch (error) {
      console.error('Error fetching form data', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      if (newPhotos.length + photos.length > 2) {
        alert('Maximum 2 photos allowed');
        return;
      }
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kiosk_id) {
      alert(t('selectMansion'));
      return;
    }
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    photos.forEach(photo => {
      data.append('photos', photo);
    });

    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        body: data
      });

      if (res.ok) {
        setSuccessMessage(t('visitRecorded'));
        setFormData({
          kiosk_id: '',
          visit_date: new Date().toISOString().split('T')[0],
          visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          visit_type_id: '',
          problem_type_id: '',
          description: ''
        });
        setPhotos([]);
        setSearchTerm('');
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      console.error('Error submitting form', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if selected visit type is "Problem"
  const selectedVisitType = visitTypes.find(vt => vt.id.toString() === formData.visit_type_id);
  const isProblemType = selectedVisitType?.name === 'Problem';

  // Filter kiosks based on search term
  const filteredKiosks = kiosks.filter(k => 
    k.kiosk_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.address && k.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedKiosk = kiosks.find(k => k.id.toString() === formData.kiosk_id);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('mansionVisitForm')}</h2>
      
      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success! </strong>
          <span className="block sm:inline">{successMessage}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage(null)}>
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('mansion')}</label>
          <div 
            className="relative w-full cursor-default border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 text-left bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="block truncate">
              {selectedKiosk ? `${selectedKiosk.kiosk_number} - ${selectedKiosk.address}` : t('selectMansion')}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </span>
          </div>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div className="sticky top-0 bg-white px-2 py-1.5 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              {filteredKiosks.length === 0 ? (
                <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                  No results found
                </div>
              ) : (
                filteredKiosks.map((k) => (
                  <div
                    key={k.id}
                    className={`cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white ${formData.kiosk_id === k.id.toString() ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}
                    onClick={() => {
                      setFormData({ ...formData, kiosk_id: k.id.toString() });
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <span className="block truncate">
                      {k.kiosk_number} - {k.address}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
            <input
              type="date"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
            <input
              type="time"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.visit_time}
              onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t('visitType')}</label>
          <select
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.visit_type_id}
            onChange={(e) => setFormData({ ...formData, visit_type_id: e.target.value })}
          >
            <option value="">{t('selectVisitType')}</option>
            {visitTypes.map(vt => (
              <option key={vt.id} value={vt.id}>{vt.name}</option>
            ))}
          </select>
        </div>

        {isProblemType && (
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('problemType')}</label>
            <select
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.problem_type_id}
              onChange={(e) => setFormData({ ...formData, problem_type_id: e.target.value })}
            >
              <option value="">{t('selectProblemType')}</option>
              {problemTypes.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">{t('photos')} (Max 2)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handlePhotoChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {photos.map((file, index) => (
              <div key={index} className="text-sm text-gray-500">{file.name}</div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
          <textarea
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
