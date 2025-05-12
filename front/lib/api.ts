import API_CONFIG from '../config/api.config';

// Función auxiliar para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para manejar reintentos
const fetchWithRetry = async (url: string, options: RequestInit, attempts = API_CONFIG.RETRY_ATTEMPTS): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    console.log("Intentando conectar a:", url);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Manejo especial para errores 403 (Forbidden)
      if (response.status === 403) {
        // Cuando se intenta obtener información del usuario (/api/users/me)
        if (url.includes('/api/users/me')) {
          // Para errores 403 en /api/users/me, debemos distinguir entre:
          // 1. Token inválido o expirado (error de sesión) - Limpiar token y redirigir a login
          // 2. Usuario sin permisos suficientes (error de permisos) - Mantener token y redireccionar
          
          // Verificar si hay header de autorización (tiene token)
          let hasAuthHeader = false;
          if (options.headers) {
            if (typeof options.headers === 'object') {
              // Si es un objeto Headers (instancia de Headers)
              if (options.headers instanceof Headers) {
                hasAuthHeader = options.headers.has('Authorization');
              } 
              // Si es un objeto normal
              else {
                hasAuthHeader = 'Authorization' in options.headers;
              }
            }
          }
          
          // Si es una solicitud al contexto del usuario actual, pero NO desde una página de navegación
          const isSessionVerification = url.includes('/api/users/me');
          
          // Si la petición tiene token pero falla, consideramos que puede ser un problema de permisos, 
          // no necesariamente que el token esté expirado
          if (isSessionVerification && hasAuthHeader) {
            console.warn('Verificando permisos - acceso denegado');
            
            // Intentamos obtener el cuerpo de la respuesta para ver si contiene más info
            try {
              const errorData = await response.clone().json();
              console.log("Detalles del error 403:", errorData);
              
              // Si el mensaje de error indica explícitamente expiración o invalidez del token
              if (errorData && 
                 (errorData.message?.toLowerCase().includes('expired') || 
                  errorData.message?.toLowerCase().includes('invalid token'))) {
                // Solo en este caso eliminamos el token
                if (typeof localStorage !== 'undefined') {
                  console.warn('Token explícitamente no válido o expirado - cerrando sesión');
                  localStorage.removeItem('bibliotech-token');
                  localStorage.removeItem('bibliotech-role');
                }
                throw new Error('Sesión expirada');
              }
            } catch (parseError) {
              // Si no podemos parsear la respuesta, asumimos que es un error de permisos
              console.log("No se pudo parsear respuesta de error:", parseError);
            }
            
            // Si llegamos aquí, asumimos que es un error de permisos, no de sesión
            throw new Error(`Error de permisos: ${response.status}`);
          } else {
            // Si no hay token o es una solicitud que no es verificación de sesión
            if (typeof localStorage !== 'undefined') {
              console.warn('Sesión no encontrada o inválida');
              localStorage.removeItem('bibliotech-token');
              localStorage.removeItem('bibliotech-role');
            }
            throw new Error('Sesión expirada');
          }
        } else {
          // Para otros endpoints con error 403, no cerramos sesión, solo reportamos el error
          throw new Error(`Error de autorización: ${response.status}`);
        }
      }
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Para errores de permisos, no reintentar (ya que seguirá dando el mismo error)
    if (error.message && (error.message.includes('Error de permisos') || error.message.includes('Error de autorización'))) {
      console.log(`No se reintentará la petición a ${url} debido a error de permisos`);
      throw error;
    }
    
    if (attempts > 0) {
      console.log(`Reintentando llamada a ${url}. Intentos restantes: ${attempts - 1}`);
      await sleep(API_CONFIG.RETRY_DELAY);
      return fetchWithRetry(url, options, attempts - 1);
    }
    
    console.error(`Error al conectar con ${url}:`, error);
    throw error;
  }
};

// Función principal para hacer llamadas a la API
const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bibliotech-token') : null;
  
  // Construir la URL completa
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetchWithRetry(url, {
      ...options,
      headers
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud ha excedido el tiempo de espera');
    }
    throw error;
  }
};

export default fetchAPI; 