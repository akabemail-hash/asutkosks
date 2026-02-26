export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: any = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure credentials are included for cookies
  const config = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials,
  };

  const response = await fetch(url, config);

  // If 401, clear token and redirect to login (optional, but good practice)
  if (response.status === 401) {
    localStorage.removeItem('token');
    // window.location.href = '/login'; // Let the component handle redirection or just fail gracefully
  }

  return response;
};
