import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Navigation as NavigationIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { useNavigate } from 'react-router-dom';

export default function KioskMap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.4093, 49.8671]); // Default Baku
  const [mapZoom, setMapZoom] = useState(12);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    fetchKiosks();
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      try {
        mapInstance.current = L.map(mapRef.current).setView(mapCenter, mapZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance.current);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map view when center/zoom changes
  useEffect(() => {
    if (mapInstance.current && mapCenter && typeof mapCenter[0] === 'number' && typeof mapCenter[1] === 'number') {
      mapInstance.current.setView(mapCenter, mapZoom);
    }
  }, [mapCenter, mapZoom]);

  // Update markers when kiosks change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const processKiosks = async () => {
      for (const k of kiosks) {
        let lat = k.latitude;
        let lng = k.longitude;

        // If coordinates are missing but address exists, try to geocode via our server proxy
        if ((!lat || !lng) && k.address) {
          try {
            const response = await fetch(`/api/kiosks/geocode?address=${encodeURIComponent(k.address)}&kiosk_id=${k.id}`);
            if (response.ok) {
              const data = await response.json();
              lat = data.lat;
              lng = data.lon;
              
              // Update local state so we don't re-fetch immediately if re-render happens
              k.latitude = lat;
              k.longitude = lng;
            }
          } catch (error) {
            console.error(`Error geocoding address for kiosk ${k.kiosk_number}:`, error);
          }
        }

        // Check map instance again after async operation
        if (!mapInstance.current) return;

        if (typeof lat === 'number' && typeof lng === 'number') {
          // Use CircleMarker to avoid Icon issues
          const marker = L.circleMarker([lat, lng], {
            color: '#4f46e5',
            fillColor: '#4f46e5',
            fillOpacity: 0.7,
            radius: 10
          }).addTo(mapInstance.current);

          // Create popup content
          const div = document.createElement('div');
          div.innerHTML = `
            <div class="p-2 min-w-[200px]">
              <h3 class="font-bold text-lg mb-1">${k.kiosk_number}</h3>
              <p class="text-sm text-gray-600 mb-2">${k.address || ''}</p>
              <p class="text-xs text-gray-500 mb-3">Supervisor: ${k.supervisor || '-'}</p>
              <button id="visit-btn-${k.id}" class="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none" style="cursor: pointer;">
                Visit
              </button>
            </div>
          `;

          // Bind popup
          marker.bindPopup(div);

          // Add click listener to button when popup opens
          marker.on('popupopen', () => {
            const btn = document.getElementById(`visit-btn-${k.id}`);
            if (btn) {
              btn.onclick = () => handleVisitClick(k.id);
            }
          });

          markersRef.current.push(marker);
        }
      }
    };

    processKiosks();
  }, [kiosks]);

  const fetchKiosks = async () => {
    try {
      const res = await fetch('/api/kiosks?limit=0');
      if (res.ok) {
        const data = await res.json();
        // Set ALL kiosks, not just valid ones, so we can try to geocode them
        setKiosks(data.data);
        
        // If we have kiosks with coordinates, center on the first one
        const validKiosk = data.data.find((k: any) => k.latitude && k.longitude && typeof k.latitude === 'number' && typeof k.longitude === 'number');
        if (validKiosk) {
           setMapCenter([validKiosk.latitude, validKiosk.longitude]);
        }
      }
    } catch (error) {
      console.error('Error fetching kiosks', error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    
    const found = kiosks.find(k => 
      k.kiosk_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.address && k.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (found && found.latitude && found.longitude && typeof found.latitude === 'number' && typeof found.longitude === 'number') {
      setMapCenter([found.latitude, found.longitude]);
      setMapZoom(16);
    } else {
      alert('Kiosk not found or has no coordinates');
    }
  };

  const handleVisitClick = (kioskId: number) => {
    navigate('/visit-form', { state: { kiosk_id: kioskId } });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white p-4 shadow-sm z-10 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={t('searchKioskPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-indigo-600"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
