import fetchAPI from '../lib/api';

export const userService = {
  // Iniciar sesión usando la API de autenticación de Strapi
  login: async (email, password) => {
    console.log("Intentando login con:", { email, password });
    
    try {
      // Usar el endpoint de autenticación de Strapi
      const response = await fetchAPI('/api/auth/local', {
        method: 'POST',
        body: JSON.stringify({
          identifier: email,
          password: password
        }),
      });
      
      console.log("Respuesta de autenticación:", response);
      
      if (!response.jwt) {
        throw new Error('Credenciales inválidas');
      }
      
      // Guardar el rol del usuario en localStorage para uso posterior
      const userRole = response.user.role?.type || 'authenticated';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bibliotech-role', userRole);
        console.log(`Rol guardado en localStorage: ${userRole}`);
      }
      
      // Retornar el usuario y token directamente desde la respuesta de Strapi
      return {
        jwt: response.jwt,
        user: {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: userRole,
          createdAt: response.user.createdAt
        }
      };
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  },

  // Registrar usuario usando la API nativa de Strapi
  register: async (userData) => {
    try {
      // Preparar datos básicos para el registro (campos estándar de Strapi)
      const registrationData = {
          username: userData.username,
          email: userData.email,
          password: userData.password
      };

      // Si tiene numcontrol, automáticamente asignar rol de alumno si no se especificó otro rol
      if (userData.numcontrol && (!userData.role || userData.role === 'authenticated')) {
        console.log("Usuario con numcontrol, asignando automáticamente rol 'alumno'");
        userData.role = 'alumno';
      }

      console.log("Intentando registrar usuario con datos:", JSON.stringify(registrationData, null, 2));
      
      // Llamar al endpoint de registro
      let response;
      try {
        response = await fetchAPI('/api/auth/local/register', {
          method: 'POST',
          body: JSON.stringify(registrationData),
        });
      } catch (registerError) {
        console.error("Error en la petición de registro:", registerError);
        if (registerError.message && registerError.message.includes('400')) {
          throw new Error('Error de validación: Comprueba que el email no esté ya registrado y que la contraseña cumpla los requisitos mínimos.');
        }
        throw new Error(`Error al registrar: ${registerError.message || 'Error desconocido'}`);
      }
      
      console.log("Respuesta al registro:", JSON.stringify(response, null, 2));
      
      if (!response.jwt) {
        throw new Error('No se recibió token de autenticación en la respuesta');
      }
      
      // Guardar el rol del usuario en localStorage para uso posterior
      const initialRole = 'authenticated';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bibliotech-role', initialRole);
        console.log(`Rol guardado en localStorage: ${initialRole}`);
      }
      
      // Si el registro fue exitoso y tenemos numcontrol, actualizar el usuario recién creado
      if (userData.numcontrol) {
        try {
          console.log(`Actualizando numcontrol (${userData.numcontrol}) para usuario ID:`, response.user.id);
          
          // Asegurarnos de usar la URL de la API correcta
          // Se usa directamente la URL en vez de obtenerla de env para asegurar consistencia
          const API_URL = "http://localhost:1337";
          
          console.log(`Enviando petición PUT a ${API_URL}/api/users/${response.user.id}`);
          
          // Actualizar el usuario con el numcontrol mediante una petición directa
          const updateResponse = await fetch(`${API_URL}/api/users/${response.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.jwt}`
            },
            body: JSON.stringify({
              numcontrol: userData.numcontrol
            })
          });
          
          // Verificar respuesta
          if (!updateResponse.ok) {
            console.error(`Error al actualizar numcontrol. Código de estado: ${updateResponse.status}`);
            try {
              const errorData = await updateResponse.json();
              console.error("Detalle del error:", errorData);
            } catch (e) {
              const errorText = await updateResponse.text();
              console.error("Respuesta de error como texto:", errorText);
            }
          } else {
            try {
              const updatedUser = await updateResponse.json();
              console.log("Usuario actualizado con numcontrol:", updatedUser);
              
              // Actualizar el usuario en la respuesta local
              response.user = {...response.user, numcontrol: userData.numcontrol};
            } catch (e) {
              console.error("Error al procesar la respuesta JSON de actualización:", e);
            }
          }
        } catch (updateError) {
          console.error("Error al actualizar numcontrol:", updateError);
          // Continuamos incluso si hay error, ya que el usuario se creó correctamente
        }
      }
      
      // Si se ha especificado un rol diferente al predeterminado (authenticated), asignarlo
      let userRole = initialRole;
      if (userData.role && userData.role !== 'authenticated') {
        try {
          console.log(`Asignando rol '${userData.role}' al usuario ID:`, response.user.id);
          
          const API_URL = "http://localhost:1337";
          
          // Obtener primero el rol para obtener su ID
          const getRoleResponse = await fetch(`${API_URL}/api/users-permissions/roles`, {
            headers: {
              'Authorization': `Bearer ${response.jwt}`
            }
          });
          
          if (!getRoleResponse.ok) {
            throw new Error(`Error al obtener roles: ${getRoleResponse.status}`);
          }
          
          const roles = await getRoleResponse.json();
          console.log("Roles disponibles:", roles);
          
          // Encontrar el ID del rol por su nombre
          let roleId = null;
          for (const role of roles.roles) {
            if (role.name.toLowerCase() === userData.role.toLowerCase() || 
                role.type.toLowerCase() === userData.role.toLowerCase()) {
              roleId = role.id;
              break;
            }
          }
          
          if (!roleId) {
            throw new Error(`No se encontró el rol '${userData.role}'`);
          }
          
          console.log(`Rol '${userData.role}' encontrado con ID: ${roleId}`);
          
          // Actualizar el usuario con el nuevo rol
          const updateRoleResponse = await fetch(`${API_URL}/api/users/${response.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.jwt}`
            },
            body: JSON.stringify({
              role: roleId
            })
          });
          
          if (!updateRoleResponse.ok) {
            throw new Error(`Error al asignar rol: ${updateRoleResponse.status}`);
          }
          
          const userWithRole = await updateRoleResponse.json();
          console.log("Usuario actualizado con nuevo rol:", userWithRole);
          userRole = userData.role;
          
          // Actualizar el localStorage con el nuevo rol
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('bibliotech-role', userRole);
            console.log(`Rol actualizado en localStorage: ${userRole}`);
          }
        } catch (roleError) {
          console.error("Error al asignar rol:", roleError);
          // Continuamos incluso si hay error, ya que el usuario se creó correctamente
        }
      }
      
      // Asegurarnos de devolver el numcontrol en la respuesta
      return {
        jwt: response.jwt,
        user: {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          numcontrol: userData.numcontrol || '',
          role: userRole,
          createdAt: response.user.createdAt
        }
      };
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  },

  // Obtener perfil del usuario actual
  getMe: async (token) => {
    return fetchAPI('/api/users/me?populate=role', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Obtener todos los usuarios (requiere permisos de admin)
  getUsers: async () => {
    try {
      console.log("Solicitando lista de usuarios");
      // Añadir populate para obtener datos completos del rol
      const response = await fetchAPI('/api/users?populate=role');
      console.log("Respuesta del API de usuarios:", response);
      return response;
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      throw error;
    }
  },

  // Obtener un usuario por ID
  getUser: async (id) => {
    try {
      console.log(`Obteniendo usuario con ID: ${id}`);
      const response = await fetchAPI(`/api/users/${id}`);
      console.log("Respuesta del API de usuario específico:", response);
      return response;
    } catch (error) {
      console.error(`Error obteniendo usuario con ID ${id}:`, error);
      throw error;
    }
  },

  // Actualizar un usuario
  updateUser: async (id, userData) => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  // Eliminar un usuario
  deleteUser: async (id) => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Asignar un rol específico a un usuario
  assignRole: async (userId, roleName, token) => {
    try {
      console.log(`Asignando rol '${roleName}' al usuario ID: ${userId}`);
      
      const API_URL = "http://localhost:1337";
      
      // Obtener primero el rol para obtener su ID
      const getRoleResponse = await fetch(`${API_URL}/api/users-permissions/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!getRoleResponse.ok) {
        throw new Error(`Error al obtener roles: ${getRoleResponse.status}`);
      }
      
      const roles = await getRoleResponse.json();
      console.log("Roles disponibles:", roles);
      
      // Encontrar el ID del rol por su nombre
      let roleId = null;
      for (const role of roles.roles) {
        if (role.name.toLowerCase() === roleName.toLowerCase() || 
            role.type.toLowerCase() === roleName.toLowerCase()) {
          roleId = role.id;
          break;
        }
      }
      
      if (!roleId) {
        throw new Error(`No se encontró el rol '${roleName}'`);
      }
      
      console.log(`Rol '${roleName}' encontrado con ID: ${roleId}`);
      
      // Actualizar el usuario con el nuevo rol
      const updateResponse = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: roleId
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Error al asignar rol: ${updateResponse.status}`);
      }
      
      const updatedUser = await updateResponse.json();
      console.log("Usuario actualizado con nuevo rol:", updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error("Error asignando rol:", error);
      throw error;
    }
  },
}; 