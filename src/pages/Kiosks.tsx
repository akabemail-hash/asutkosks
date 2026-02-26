import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash, Search, X, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchWithAuth } from '../utils/api';

export default function Kiosks() {
  const { t } = useTranslation();
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    kiosk_number: '',
    address: '',
    supervisor: '',
    mobile_number: '',
    shelf: '',
    is_active: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKiosks();
  }, [filters]);

  const fetchKiosks = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: any = {
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      };

      if (filters.kiosk_number) queryParams.kiosk_number = filters.kiosk_number;
      if (filters.address) queryParams.address = filters.address;
      if (filters.supervisor) queryParams.supervisor = filters.supervisor;
      if (filters.mobile_number) queryParams.mobile_number = filters.mobile_number;
      if (filters.shelf) queryParams.shelf = filters.shelf;
      if (filters.is_active) queryParams.is_active = filters.is_active;

      const query = new URLSearchParams(queryParams).toString();
      
      const res = await fetchWithAuth(`/api/kiosks?${query}`);
      if (res.ok) {
        const data = await res.json();
        setKiosks(data.data);
        setPagination(data.pagination);
      } else {
        setError(`Failed to fetch kiosks: ${res.status} ${res.statusText}`);
        console.error('Failed to fetch kiosks:', res.status, res.statusText);
      }
    } catch (error: any) {
      setError(`Error fetching kiosks: ${error.message}`);
      console.error('Error fetching kiosks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Fetch all kiosks for export
      const res = await fetchWithAuth('/api/kiosks?limit=0');
      if (!res.ok) throw new Error('Failed to fetch data for export');
      const data = await res.json();
      
      const ws = XLSX.utils.json_to_sheet(data.data.map((k: any) => ({
        kiosk_number: typeof k.kiosk_number === 'number' ? Math.floor(k.kiosk_number) : k.kiosk_number?.toString().replace(/\.0$/, ''),
        supervisor: k.supervisor,
        mobile_number: k.mobile_number,
        address: k.address,
        shelf: k.shelf,
        latitude: k.latitude,
        longitude: k.longitude,
        is_active: k.is_active ? 1 : 0
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kiosks");
      XLSX.writeFile(wb, "kiosks.xlsx");
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validate and map data if necessary
        // Assuming Excel columns match DB fields or close to it
        // We expect: kiosk_number, supervisor, mobile_number, address, is_active
        
        const res = await fetchWithAuth('/api/kiosks/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          const result = await res.json();
          alert(result.message || t('importSuccess'));
          fetchKiosks();
        } else {
          const err = await res.json();
          alert(t('importError') + ': ' + err.message);
        }
      } catch (err: any) {
        alert(t('importError') + ': ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem ? `/api/kiosks/${editingItem.id}` : '/api/kiosks';

    try {
      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setModalOpen(false);
        fetchKiosks();
        setEditingItem(null);
        setFormData({});
      } else {
        const err = await res.json();
        alert('Error saving data: ' + err.message);
      }
    } catch (error) {
      console.error('Error saving', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete') + '?')) return;
    try {
      await fetchWithAuth(`/api/kiosks/${id}`, { method: 'DELETE' });
      fetchKiosks();
    } catch (error) {
      console.error('Error deleting', error);
    }
  };

  const handleDeleteAll = async () => {
    console.log('Delete All clicked');
    if (!window.confirm(t('deleteAllConfirm') || 'Are you sure you want to delete ALL kiosks? This action cannot be undone.')) {
      console.log('Delete All cancelled');
      return;
    }
    
    console.log('Sending DELETE request to /api/kiosks/all');
    try {
      const res = await fetchWithAuth('/api/kiosks/all', { method: 'DELETE' });
      console.log('DELETE response status:', res.status);
      
      if (res.ok) {
        fetchKiosks();
        alert(t('allKiosksDeleted') || 'All kiosks deleted successfully');
      } else {
        const err = await res.json();
        console.error('DELETE error:', err);
        alert('Error deleting all kiosks: ' + err.message);
      }
    } catch (error) {
      console.error('Error deleting all kiosks', error);
      alert('Error deleting all kiosks');
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item || { is_active: true });
    setModalOpen(true);
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t('kiosks')}</h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".xlsx, .xls" 
          />
          <button
            onClick={handleImportClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('import')}
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </button>
          <button
            onClick={handleDeleteAll}
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none"
          >
            <Trash className="h-4 w-4 mr-2" />
            {t('deleteAll')}
          </button>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('add')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('kioskNumber')}</label>
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.kiosk_number}
              onChange={(e) => setFilters({ ...filters, kiosk_number: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('supervisor')}</label>
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.supervisor}
              onChange={(e) => setFilters({ ...filters, supervisor: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('mobileNumber')}</label>
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.mobile_number}
              onChange={(e) => setFilters({ ...filters, mobile_number: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.address}
              onChange={(e) => setFilters({ ...filters, address: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('shelf')}</label>
            <input
              type="text"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.shelf}
              onChange={(e) => setFilters({ ...filters, shelf: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
            <select
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value, page: 1 })}
            >
              <option value="">{t('all')}</option>
              <option value="1">{t('active')}</option>
              <option value="0">{t('passive')}</option>
            </select>
          </div>
          <div className="flex items-end md:col-span-2 lg:col-span-2">
            <button
              onClick={() => setFilters({
                kiosk_number: '',
                address: '',
                supervisor: '',
                mobile_number: '',
                shelf: '',
                is_active: '',
                page: 1,
                limit: 10
              })}
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
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('kioskNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('supervisor')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mobileNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('address')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('shelf')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kiosks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No data found</td>
                    </tr>
                  ) : (
                    kiosks.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {typeof item.kiosk_number === 'number' ? Math.floor(item.kiosk_number) : item.kiosk_number?.toString().replace(/\.0$/, '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supervisor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.mobile_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.shelf}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.is_active ? t('active') : t('passive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {kiosks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No data found</div>
              ) : (
                <div className="space-y-4 p-4">
                  {kiosks.map((item: any) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {typeof item.kiosk_number === 'number' ? Math.floor(item.kiosk_number) : item.kiosk_number?.toString().replace(/\.0$/, '')}
                          </h3>
                          <p className="text-sm text-gray-500">{item.address}</p>
                        </div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.is_active ? t('active') : t('passive')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1 mb-4">
                        <p><span className="font-medium">{t('supervisor')}:</span> {item.supervisor}</p>
                        <p><span className="font-medium">{t('mobileNumber')}:</span> {item.mobile_number}</p>
                        <p><span className="font-medium">{t('shelf')}:</span> {item.shelf}</p>
                      </div>
                      <div className="flex justify-end space-x-3 border-t pt-3">
                        <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                          <Edit className="h-4 w-4 mr-1" /> {t('edit')}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 flex items-center">
                          <Trash className="h-4 w-4 mr-1" /> {t('delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to <span className="font-medium">{Math.min(filters.page * filters.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page + 1) })}
                  disabled={filters.page === pagination.totalPages || pagination.totalPages === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setModalOpen(false)}></div>

            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        {editingItem ? t('edit') : t('add')} {t('kiosks')}
                      </h3>
                      <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('kioskNumber')}</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.kiosk_number || ''}
                          onChange={(e) => setFormData({ ...formData, kiosk_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('supervisor')}</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.supervisor || ''}
                          onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('mobileNumber')}</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.mobile_number || ''}
                          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('address')}</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('shelf')}</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={formData.shelf || ''}
                          onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Latitude</label>
                          <input
                            type="number"
                            step="any"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.latitude || ''}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Longitude</label>
                          <input
                            type="number"
                            step="any"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.longitude || ''}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="is_active"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={formData.is_active || false}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                          {t('active')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
