// frontend/src/services/api.js
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  static getToken() {
    return localStorage.getItem('token');
  }

  static getHeaders() {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  static async request(url, options = {}) {
    const { method = 'GET', data } = options;
    
    const config = {
      method,
      headers: this.getHeaders(),
      credentials: 'include' // Importante para cookies si las usas
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  static async get(url) {
    return this.request(url);
  }

  static async post(url, data) {
    return this.request(url, { method: 'POST', data });
  }

  static async put(url, data) {
    return this.request(url, { method: 'PUT', data });
  }

  static async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }

  static async handleResponse(response) {
      // Primero verificar si hay contenido
      if (response.status === 204 || response.status === 205) {
          return {};
      }
      
      const contentType = response.headers.get('content-type');
      
      // IMPORTANTE: Si es CSV, devolver como texto sin parsear como JSON
      if (contentType && contentType.includes('text/csv')) {
          const text = await response.text();
          
          if (!response.ok) {
              throw new Error(text || `HTTP error! status: ${response.status}`);
          }
          
          // Para CSV, devolvemos el texto directamente
          return text;
      }
      
      // Si no es CSV, verificar si es JSON
      if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          
          if (!response.ok) {
              throw new Error(text || `HTTP error! status: ${response.status}`);
          }
          
          // Intentar parsear como JSON si es posible
          try {
              return text ? JSON.parse(text) : {};
          } catch {
              return text;
          }
      }
      
      // Si es JSON, parsearlo normalmente
      const data = await response.json();
      
      if (!response.ok) {
          const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
          const error = new Error(errorMessage);
          error.status = response.status;
          error.data = data;
          throw error;
      }
      
      return data;
  }

  // Métodos específicos para el dashboard
  static async getDashboardCoordinador() {
    return this.get('/dashboard/coordinador');
  }

  static async getMetricasGlobales(periodo = 'mes') {
    return this.get(`/dashboard/metricas-globales?periodo=${periodo}`);
  }

  static async getEstadisticas() {
    return this.get('/estadisticas/generales');
  }

  // Método para obtener información del usuario actual
  static async getCurrentUser() {
    return this.get('/auth/me');
  }
}

export default ApiService;