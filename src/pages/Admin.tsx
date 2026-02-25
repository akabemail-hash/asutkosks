import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash, X, Save } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

export default function Admin() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [activeTab]);

  const fetchRoles = async () => {
    try {
      const res = await fetchWithAuth('/api/roles');
      if (res.ok) setRolesList(await res.json());
    } catch (error) {
      console.error('Error fetching roles', error);
    }
  };

  const [rolesList, setRolesList] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const res = await fetchWithAuth('/api/users');
        if (res.ok) {
          setUsers(await res.json());
        } else {
          setError(`Failed to fetch users: ${res.status} ${res.statusText}`);
          console.error('Failed to fetch users:', res.status, res.statusText);
        }
      } else {
        const res = await fetchWithAuth('/api/roles');
        if (res.ok) {
          setRoles(await res.json());
        } else {
          setError(`Failed to fetch roles: ${res.status} ${res.statusText}`);
          console.error('Failed to fetch roles:', res.status, res.statusText);
        }
      }
    } catch (error: any) {
      setError(`Error fetching data: ${error.message}`);
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const url = activeTab === 'users' ? '/api/users' : '/api/roles';
    const method = editingItem ? 'PUT' : 'POST';
    const endpoint = editingItem ? `${url}/${editingItem.id}` : url;

    let dataToSend = { ...formData };
    if (activeTab === 'roles' && typeof dataToSend.permissions === 'string') {
      try {
        dataToSend.permissions = JSON.parse(dataToSend.permissions);
      } catch (e) {
        alert('Invalid JSON in permissions');
        return;
      }
    }

    try {
      const res = await fetchWithAuth(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        setModalOpen(false);
        fetchData();
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
    const url = activeTab === 'users' ? `/api/users/${id}` : `/api/roles/${id}`;
    try {
      await fetchWithAuth(url, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting', error);
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item || (activeTab === 'users' ? { language: 'en', role_id: 1 } : { permissions: [] }));
    setModalOpen(true);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('users')}
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`${activeTab === 'roles' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {t('roles')}
          </button>
        </nav>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('add')}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'users' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('username')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('language')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('created_at')}</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('permissions')}</th>
                  </>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'users' ? users : roles).map((item: any) => (
                <tr key={item.id}>
                  {activeTab === 'users' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.role_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.language}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.created_at}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{JSON.stringify(item.permissions)}</td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {(activeTab === 'users' ? users : roles).length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No data found</div>
          ) : (
            <div className="space-y-4 p-4">
              {(activeTab === 'users' ? users : roles).map((item: any) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {activeTab === 'users' ? item.username : item.name}
                    </h3>
                    <div className="flex space-x-3">
                      <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-1">
                    {activeTab === 'users' ? (
                      <>
                        <p><span className="font-medium">{t('role')}:</span> {item.role_name}</p>
                        <p><span className="font-medium">{t('language')}:</span> {item.language}</p>
                        <p><span className="font-medium">{t('created_at')}:</span> {item.created_at}</p>
                      </>
                    ) : (
                      <p><span className="font-medium">{t('permissions')}:</span> {JSON.stringify(item.permissions)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                        {editingItem ? t('edit') : t('add')} {activeTab === 'users' ? t('users') : t('roles')}
                      </h3>
                      <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="mt-2 space-y-4">
                      {activeTab === 'users' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('username')}</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.username || ''}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
                            <input
                              type="password"
                              placeholder={editingItem ? 'Leave blank to keep unchanged' : ''}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.password || ''}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('role')}</label>
                            <select
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.role_id || ''}
                              onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                            >
                              <option value="">Select Role</option>
                              {Array.isArray(rolesList) && rolesList.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('language')}</label>
                            <select
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.language || 'en'}
                              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            >
                              <option value="en">English</option>
                              <option value="az">Azərbaycan</option>
                              <option value="ru">Русский</option>
                              <option value="tr">Türkçe</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('name')}</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={formData.name || ''}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('permissions')}</label>
                            <textarea
                              rows={3}
                              placeholder='["/admin", "/users"]'
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={typeof formData.permissions === 'string' ? formData.permissions : JSON.stringify(formData.permissions || [])}
                              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">JSON array of paths</p>
                          </div>
                        </>
                      )}
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
