import fetchAPI from '../lib/api';

// Definir interfaz de usuario
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  numcontrol?: string;
  createdAt: string;
}

export const authService = {
  // Iniciar sesión usando la API de autenticación de Strapi
  login: async (email: string, password: string): Promise<{ jwt: string; user: User }> => {
    // Asegurar que el email siempre esté en minúsculas
    const normalizedEmail = email.toLowerCase();
    
    console.log("Intentando login con:", { email: normalizedEmail, password });
    
    try {
      // Usar el endpoint de autenticación de Strapi
      console.log("Llamando a la API en:", '/api/auth/local');
      const response = await fetchAPI('/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: normalizedEmail,
          password: password
        }),
      });
      
      console.log("Respuesta completa de la API:", response);
      console.log("Estructura detallada del usuario:", JSON.stringify(response.user, null, 2));
      
      if (!response || !response.jwt) {
        console.error("No se recibió token JWT en la respuesta");
        throw new Error('Credenciales inválidas');
      }
      
      // Guardar token en localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bibliotech-token', response.jwt);
      }
      
      // Explorar todas las posibles ubicaciones del rol
      let userRole = response.user.rol || 
                   response.user.role?.type || 
                   response.user.role?.name || 
                   (response.user.role?.data?.attributes?.name) || 
                   (response.user.role?.data?.attributes?.type) || 
                   'authenticated';
      
      // Normalizar roles conocidos
      if (userRole === "Administrador") {
        userRole = "administrador";
      } else if (userRole === "Alumno") {
        userRole = "alumno";
      } else if (userRole === "Interno") {
        userRole = "interno";
      }
      
      console.log("Rol determinado en login:", userRole);
      
      // Guardar información del usuario en localStorage para recuperación en caso de errores
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bibliotech-role', userRole);
        localStorage.setItem('bibliotech-username', response.user.username || 'Usuario');
        localStorage.setItem('bibliotech-email', response.user.email || '');
        localStorage.setItem('bibliotech-numcontrol', response.user.numcontrol || response.user.Numcontrol || '');
        localStorage.setItem('bibliotech-user-id', response.user.id?.toString() || '0');
      }
      
      // Crear el objeto de usuario con la información básica
      const userData = {
        jwt: response.jwt,
        user: {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: userRole,
          numcontrol: response.user.numcontrol || response.user.Numcontrol || '',
          createdAt: response.user.createdAt
        }
      };
      
      // Retornar el usuario y token directamente desde la respuesta de Strapi
      return userData;
    } catch (error: any) {
      console.error("Error detallado en login:", error);
      if (error.message.includes('timeout') || error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.');
      }
      throw error;
    }
  },

  // Registrar usuario usando la API de Strapi
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    numcontrol?: string;
  }) => {
    try {
      // Preparar datos básicos para el registro
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password
      };

      console.log("Intentando registrar usuario con datos:", JSON.stringify(registrationData, null, 2));
      
      // Llamar al endpoint de registro
      const response = await fetchAPI('/api/auth/local/register', {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });
      
      console.log("Respuesta al registro:", JSON.stringify(response, null, 2));
      
      if (!response.jwt) {
        throw new Error('No se recibió token de autenticación en la respuesta');
      }
      
      // Guardar el token y el rol del usuario en localStorage
      const initialRole = 'authenticated';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bibliotech-token', response.jwt);
        localStorage.setItem('bibliotech-role', initialRole);
        console.log(`Token y rol guardados en localStorage: ${initialRole}`);
      }
      
      // Si el registro fue exitoso y tenemos numcontrol, actualizar el usuario
      if (userData.numcontrol) {
        try {
          console.log(`Actualizando numcontrol (${userData.numcontrol}) para usuario ID:`, response.user.id);
          
          await fetchAPI(`/api/users/${response.user.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${response.jwt}`
            },
            body: JSON.stringify({
              numcontrol: userData.numcontrol
            })
          });
          
          // Actualizar el usuario en la respuesta local
          response.user = {...response.user, numcontrol: userData.numcontrol};
        } catch (updateError) {
          console.error("Error al actualizar numcontrol:", updateError);
        }
      }
      
      return {
        jwt: response.jwt,
        user: {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          numcontrol: userData.numcontrol || '',
          role: initialRole,
          createdAt: response.user.createdAt
        }
      };
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  },

  // Cerrar sesión
  logout: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('bibliotech-token');
      localStorage.removeItem('bibliotech-role');
    }
  },

  // Obtener el usuario actual
  getMe: async (token: string) => {
    try {
      const response = await fetchAPI('/api/users/me?populate=role', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      console.log("Respuesta getMe completa:", JSON.stringify(response, null, 2));
      
      // Explorar todas las posibles ubicaciones del rol, priorizando el campo 'rol' directo
      let userRole = response.rol || 
                    response.role?.type || 
                    response.role?.name || 
                    (response.role?.data?.attributes?.name) || 
                    (response.role?.data?.attributes?.type) || 
                    'authenticated';
      
      // Normalizar roles conocidos
      if (userRole === "Administrador") {
        userRole = "administrador";
      } else if (userRole === "Alumno") {
        userRole = "alumno";
      } else if (userRole === "Interno") {
        userRole = "interno";
      }
      
      console.log("Rol determinado en getMe:", userRole);
      
      // Guardar el rol en localStorage para uso futuro, especialmente para recuperación en caso de problemas
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bibliotech-role', userRole);
      }
      
      return {
        id: response.id,
        username: response.username,
        email: response.email,
        role: userRole,
        numcontrol: response.numcontrol || response.Numcontrol || '',
        createdAt: response.createdAt
      };
    } catch (error: any) {
      console.error("Error al obtener usuario:", error);
      
      // Distinguir entre errores de sesión y errores de permisos
      if (error.message && error.message.includes('Error de permisos')) {
        // Si es un error de permisos (no de sesión), intentamos recuperar los datos del usuario
        // desde localStorage para mantener la sesión activa
        try {
          const savedRole = localStorage.getItem('bibliotech-role') || 'authenticated';
          const savedUsername = localStorage.getItem('bibliotech-username') || 'Usuario';
          const savedEmail = localStorage.getItem('bibliotech-email') || '';
          
          console.log("Usando información guardada del usuario:", {
            role: savedRole,
            username: savedUsername,
            email: savedEmail
          });
          
          // Devolver un usuario con la información guardada
          return {
            id: 0, // ID genérico
            username: savedUsername,
            email: savedEmail,
            role: savedRole,
            numcontrol: localStorage.getItem('bibliotech-numcontrol') || '',
            createdAt: new Date().toISOString()
          };
        } catch (storageError) {
          console.error("Error al recuperar datos del localStorage:", storageError);
        }
      }
      
      // En caso de error de sesión o si no pudimos recuperar datos, propagar el error
      throw error;
    }
  }
}; 