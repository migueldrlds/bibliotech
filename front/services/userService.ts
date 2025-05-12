import fetchAPI from '../lib/api';

export interface User {
  id: number | string;
  documentId?: string;
  username: string;
  email: string;
  numcontrol?: string;
  Numcontrol?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  blocked?: boolean;
  confirmed?: boolean;
  campus?: string;
  Genero?: string;
  Carrera?: string;
  Estado?: string;
}

export const userService = {
  // Obtener todos los usuarios (requiere permisos de admin)
  getUsers: async (): Promise<User[]> => {
    try {
      console.log("Solicitando lista de usuarios");
      // Obtener todos los datos de los usuarios con su rol
      const response = await fetchAPI('/api/users?populate=role');
      console.log("Respuesta del API de usuarios:", response);
      
      // Mapear la respuesta al formato esperado
      if (Array.isArray(response)) {
        return response.map(user => ({
          id: user.id,
          documentId: user.documentId,
          username: user.username || 'Sin nombre',
          email: user.email || 'Sin email',
          numcontrol: user.Numcontrol?.toString() || user.numcontrol?.toString() || '',
          Numcontrol: user.Numcontrol,
          role: user.role?.type || 
                (user.role?.data?.attributes?.type) || 
                (user.role?.data?.attributes?.name) || 
                'authenticated',
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt,
          publishedAt: user.publishedAt,
          blocked: user.blocked || false,
          confirmed: user.confirmed || false,
          // Incluir campos adicionales
          campus: user.campus,
          Genero: user.Genero,
          Carrera: user.Carrera,
          Estado: user.Estado
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      throw error;
    }
  },

  // Búsqueda avanzada de usuarios con soporte para paginación
  searchUsers: async (queryParams: string): Promise<User[]> => {
    try {
      console.log('Realizando búsqueda avanzada de usuarios con parámetros:', queryParams);
      
      // Construir URL con parámetros enviados
      let url = '/api/users?populate=*';
      
      if (queryParams) {
        url = `${url}&${queryParams}`;
      }
      
      const response = await fetchAPI(url);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error en búsqueda avanzada de usuarios:', error);
      return [];
    }
  },

  // Obtener un usuario específico por ID
  getUser: async (id: string): Promise<User | null> => {
    try {
      console.log(`Obteniendo usuario con ID ${id}`);
      const response = await fetchAPI(`/api/users/${id}?populate=role`);
      
      if (response) {
        return {
          id: response.id,
          documentId: response.documentId,
          username: response.username || 'Sin nombre',
          email: response.email || 'Sin email',
          numcontrol: response.Numcontrol?.toString() || response.numcontrol?.toString() || '',
          Numcontrol: response.Numcontrol,
          role: response.role?.type || 
                (response.role?.data?.attributes?.type) || 
                (response.role?.data?.attributes?.name) || 
                'authenticated',
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.updatedAt,
          publishedAt: response.publishedAt,
          blocked: response.blocked || false,
          confirmed: response.confirmed || false,
          // Incluir campos adicionales
          campus: response.campus,
          Genero: response.Genero,
          Carrera: response.Carrera,
          Estado: response.Estado
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error obteniendo usuario con ID ${id}:`, error);
      throw error;
    }
  }
}; 