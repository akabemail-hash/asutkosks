import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Edit, Trash, Eye, X, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function VisitReport() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    kiosk_number: ''
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState<any>({});
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [visitTypes, setVisitTypes] = useState<any[]>([]);
  const [problemTypes, setProblemTypes] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin'; // Assuming role is available in user object or we fetch it

  useEffect(() => {
    fetchVisits();
    if (isAdmin) {
      fetchDropdownData();
    }
  }, [filters]);

  const fetchDropdownData = async () => {
    const [kRes, vtRes, ptRes] = await Promise.all([
      fetch('/api/kiosks?limit=0'),
      fetch('/api/visit-types'),
      fetch('/api/problem-types')
    ]);
    if (kRes.ok) setKiosks((await kRes.json()).data);
    if (vtRes.ok) setVisitTypes(await vtRes.json());
    if (ptRes.ok) setProblemTypes(await ptRes.json());
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      const res = await fetch(`/api/visits/report?${query}`);
      if (res.ok) {
        setVisits(await res.json());
      }
    } catch (error) {
      console.error('Error fetching visits', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete') + '?')) return;
    try {
      const res = await fetch(`/api/visits/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVisits();
        if (selectedVisit?.id === id) setModalOpen(false);
      } else {
        alert('Error deleting visit');
      }
    } catch (error) {
      console.error('Error deleting', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/visits/${selectedVisit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        setModalOpen(false);
        fetchVisits();
        setIsEditing(false);
      } else {
        alert('Error updating visit');
      }
    } catch (error) {
      console.error('Error updating', error);
    }
  };

  const openModal = (visit: any, edit: boolean = false) => {
    setSelectedVisit(visit);
    setIsEditing(edit);
    if (edit) {
      setEditForm({
        kiosk_id: visit.kiosk_id,
        visit_date: visit.visit_date,
        visit_time: visit.visit_time,
        visit_type_id: visit.visit_type_id,
        problem_type_id: visit.problem_type_id,
        description: visit.description
      });
    }
    setModalOpen(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('mansionVisitReport')}</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')}</label>
            <input
              type="date"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
            <input
              type="date"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('kioskNumber')}</label>
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.kiosk_number}
              onChange={(e) => setFilters({ ...filters, kiosk_number: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ start_date: '', end_date: '', kiosk_number: '' })}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <X className="h-4 w-4 mr-2" />
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('kioskNumber')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('username')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('visitType')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('problemType')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No records found</td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openModal(visit)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.visit_date} {visit.visit_time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.kiosk_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.visit_type_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{visit.problem_type_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(visit, false); }} 
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openModal(visit, true); }} 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(visit.id); }} 
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {visits.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No records found</div>
          ) : (
            <div className="space-y-4 p-4">
              {visits.map((visit) => (
                <div key={visit.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4" onClick={() => openModal(visit)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {visit.kiosk_number}
                      </h3>
                      <p className="text-sm text-gray-500">{visit.visit_date} {visit.visit_time}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {visit.visit_type_name}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-1 mb-3">
                    <p><span className="font-medium">{t('username')}:</span> {visit.username}</p>
                    <p><span className="font-medium">{t('problemType')}:</span> {visit.problem_type_name || '-'}</p>
                  </div>

                  <div className="flex justify-end space-x-3 border-t pt-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(visit, false); }} 
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" /> {t('details')}
                    </button>
                    {isAdmin && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(visit, true); }} 
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" /> {t('edit')}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(visit.id); }} 
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash className="h-4 w-4 mr-1" /> {t('delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedVisit && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isEditing ? t('edit') : t('details')}
                  </h3>
                  <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                     <div>
                      <label className="block text-sm font-medium text-gray-700">{t('mansion')}</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={editForm.kiosk_id}
                        onChange={(e) => setEditForm({ ...editForm, kiosk_id: e.target.value })}
                      >
                        {kiosks.map(k => (
                          <option key={k.id} value={k.id}>{k.kiosk_number}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
                        <input
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={editForm.visit_date}
                          onChange={(e) => setEditForm({ ...editForm, visit_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
                        <input
                          type="time"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={editForm.visit_time}
                          onChange={(e) => setEditForm({ ...editForm, visit_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('visitType')}</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={editForm.visit_type_id}
                        onChange={(e) => setEditForm({ ...editForm, visit_type_id: e.target.value })}
                      >
                        {visitTypes.map(vt => (
                          <option key={vt.id} value={vt.id}>{vt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('problemType')}</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={editForm.problem_type_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, problem_type_id: e.target.value })}
                      >
                        <option value="">-</option>
                        {problemTypes.map(pt => (
                          <option key={pt.id} value={pt.id}>{pt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('kioskNumber')}</p>
                        <p className="text-sm text-gray-900">{selectedVisit.kiosk_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('address')}</p>
                        <p className="text-sm text-gray-900">{selectedVisit.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('date')}</p>
                        <p className="text-sm text-gray-900">{selectedVisit.visit_date} {selectedVisit.visit_time}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('username')}</p>
                        <p className="text-sm text-gray-900">{selectedVisit.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('visitType')}</p>
                        <p className="text-sm text-gray-900">{selectedVisit.visit_type_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{t('problemType')}</p>
                        <p className="text-sm text-gray-900">{selectedVisit.problem_type_name || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('description')}</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedVisit.description || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">{t('photos')}</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedVisit.photos && JSON.parse(selectedVisit.photos).map((photo: string, idx: number) => (
                          <a key={idx} href={photo} target="_blank" rel="noopener noreferrer">
                            <img src={photo} alt={`Visit photo ${idx + 1}`} className="h-24 w-24 object-cover rounded border" />
                          </a>
                        ))}
                        {(!selectedVisit.photos || JSON.parse(selectedVisit.photos).length === 0) && (
                          <p className="text-sm text-gray-400">No photos</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {t('save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {t('cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
                  >
                    {t('close')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
