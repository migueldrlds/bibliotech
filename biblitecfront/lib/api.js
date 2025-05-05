const API_URL = "http://localhost:1337";

// Tokens específicos por rol
const API_TOKENS = {
  administrador: "e2a00a6e0c5faa9ce9a6df5f22d6c8b87200c4312ca90bca1a0e4b270a9a50a86f5bbd7a66e34c15b170c1d627eaf6c115d76a363fd83b6cbcbe5f99c4c1c9a9206ea0a9b0fc6cd96f5d23f898797f3179fc96c252471f7b9a9699827c1b40ce7c96abcde0b38ad3d958203557fcfe06d0fb91cd1715268b808fdeb4e5c8615f",
  interno: "fe5b6a50e530a63ca41291fce6fa4ef03c8e4b8d7073aef8b4d9cbbf66ed05b065cf05062dd33e7c35ea048e9c4b0ed63211d573bd79970892f88abdb15d6603f4637e05750c93ac0100ddb0b60467651b70a71666ef48621050b97eab8d1b00d3c939eeead5097c43a74c93bc0fcbd31e183ab7b6d42bec6a68057b176e9285",
  alumno: "1456c9a7ef2a05ad7682650e609c62455038960e7b7640021c6f72d1d6801289ee92627996f45c2f5aa9d77bb1be6f2c579d9bfec811788ec8a9933bb6ed68be81e1c854cc4f638106d9e3930a1fa02e93fbefbd8f97e5e315ec01a1b6149cf6280601b2dcb71045d4f912365a459ed93196c62e58bbc8aaa1be3e2e85a54978"
};

// Token por defecto (usando Administrador como predeterminado)
const DEFAULT_API_TOKEN = API_TOKENS.administrador;

async function fetchAPI(endpoint, options = {}) {
  // Para endpoints de autenticación, no usamos el token de API
  const isAuthEndpoint = endpoint.startsWith('/api/auth/');
  
  // Obtenemos el token JWT y el rol del usuario del almacenamiento local
  const userToken = typeof localStorage !== 'undefined' ? localStorage.getItem('bibliotech-token') : null;
  const userRole = typeof localStorage !== 'undefined' ? localStorage.getItem('bibliotech-role') : null;
  
  console.log("Token de usuario:", userToken ? "Presente" : "No encontrado");
  console.log("Rol de usuario:", userRole || "No definido");
  
  // Seleccionar el token de API según el rol (si no hay usuario autenticado)
  let apiToken = DEFAULT_API_TOKEN;
  if (!userToken && userRole && API_TOKENS[userRole.toLowerCase()]) {
    apiToken = API_TOKENS[userRole.toLowerCase()];
    console.log(`Usando token de API para rol: ${userRole}`);
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Si es un endpoint de autenticación no enviamos ningún token
      // Si tenemos un token JWT en localStorage, lo usamos
      // En caso contrario, usamos el token API según el rol
      ...(!isAuthEndpoint && {
        'Authorization': `Bearer ${userToken || apiToken}`
      })
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  // Si se proporciona un token específico en options, ese prevalece
  if (options.headers?.Authorization) {
    mergedOptions.headers.Authorization = options.headers.Authorization;
  }

  const url = `${API_URL}${endpoint}`;
  console.log(`Fetching ${url}`, {
    method: mergedOptions.method || 'GET',
    headers: {
      ...mergedOptions.headers,
      Authorization: mergedOptions.headers.Authorization ? 
        mergedOptions.headers.Authorization.substring(0, 15) + '...' : 'None'
    }
  });
  
  try {
    const res = await fetch(url, mergedOptions);
    
    if (!res.ok) {
      const error = new Error(`Error en la API: ${res.status} ${res.statusText}`);
      error.status = res.status;
      try {
        error.info = await res.json();
        console.error('Error detallado:', error.info);
      } catch (e) {
        try {
          error.info = await res.text();
          console.error('Error como texto:', error.info);
        } catch (textError) {
          error.info = 'No se pudo obtener información de error';
          console.error('No se pudo extraer información del error');
        }
      }
      throw error;
    }
    
    // Para solicitudes DELETE, puede que no haya cuerpo en la respuesta
    // Verificamos primero si es una operación DELETE y si hay contenido
    if (mergedOptions.method === 'DELETE') {
      const contentType = res.headers.get('content-type');
      // Si no hay tipo de contenido o el content-length es 0, devolver un objeto vacío
      if (!contentType || res.headers.get('content-length') === '0') {
        return { success: true };
      }
    }
    
    // Procesar JSON sólo si hay contenido
    try {
      const json = await res.json();
      return json;
    } catch (e) {
      console.warn('No se pudo parsear la respuesta como JSON, devolviendo texto plano');
      const text = await res.text();
      return { text, success: res.ok };
    }
  } catch (error) {
    console.error(`Error al conectar con ${url}:`, error);
    throw error;
  }
}

export default fetchAPI; 