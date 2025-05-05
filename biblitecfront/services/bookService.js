import fetchAPI from '../lib/api';

// Función para mapear los datos del servidor a la nueva estructura
const mapBookData = (bookData) => {
  if (!bookData) return null;
  
  // Asegurarse de incluir tanto id como id_libro
  return {
    id: bookData.id, // Importante: Este es el ID numérico real en la base de datos
    documentId: bookData.documentId,
    id_libro: bookData.id_libro || bookData.id?.toString() || '',
    unidad: typeof bookData.unidad === 'number' 
      ? bookData.unidad 
      : (typeof bookData.location === 'string' && !isNaN(parseInt(bookData.location)) 
          ? parseInt(bookData.location) 
          : 0),
    titulo: bookData.titulo || bookData.title || '',
    autor: bookData.autor || bookData.author || '',
    clasificacion: bookData.clasificacion || bookData.genre || '',
    
    // Mantener campos originales para compatibilidad
    ...bookData
  };
};

export const bookService = {
  // Obtener todos los libros
  getBooks: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetchAPI(`/api/books?${queryString}`);
    
    if (response.data) {
      // Mapear los datos al nuevo formato
      response.data = response.data.map(mapBookData);
    }
    
    return response;
  },

  // Obtener un libro por ID
  getBook: async (id) => {
    const response = await fetchAPI(`/api/books/${id}?populate=*`);
    
    if (response.data) {
      // Mapear el libro al nuevo formato
      response.data = mapBookData(response.data);
    }
    
    return response;
  },

  // Crear un nuevo libro
  createBook: async (bookData) => {
    try {
      // Asegurarse de que id_libro siempre sea un string, nunca null
      const id_libro = bookData.id_libro || `AUTO-${Date.now()}`;
      
      // Asegurar que unidad sea un número
      let unidad = 1;
      if (bookData.unidad !== undefined) {
        unidad = typeof bookData.unidad === 'number' 
          ? bookData.unidad 
          : parseInt(bookData.unidad, 10) || 1;
      }
      
      // Preparar los datos exactamente como los espera Strapi
      const serverData = {
        id_libro: id_libro,
        titulo: bookData.titulo || "",
        autor: bookData.autor || "",
        clasificacion: bookData.clasificacion || "",
        unidad: unidad
      };
      
      console.log('Datos enviados al servidor:', JSON.stringify({ data: serverData }));
      console.log('Tipo de unidad:', typeof serverData.unidad, serverData.unidad);
      
      try {
        const response = await fetchAPI('/api/books', {
          method: 'POST',
          body: JSON.stringify({ data: serverData }),
        });
        
        console.log('Respuesta del servidor:', response);
        return response;
      } catch (apiError) {
        console.error('Error detallado de la API:', apiError);
        console.error('Información adicional:', apiError.info);
        throw apiError;
      }
    } catch (error) {
      console.error("Error en createBook:", error);
      throw error;
    }
  },

  // Actualizar un libro existente
  updateBook: async (id, bookData) => {
    try {
      console.log("=== INICIO DE ACTUALIZACIÓN DE LIBRO ===");
      console.log(`Actualizando libro con ID: ${id}`);
      console.log("Datos recibidos:", JSON.stringify(bookData, null, 2));
      
      // Verificar si tenemos documentId
      const documentId = bookData.documentId || id;
      console.log(`ID a usar para actualización: ${documentId} (${bookData.documentId ? 'documentId' : 'id numérico'})`);
      
      // Preparar datos para Strapi en formato correcto
      const formattedData = {
        data: {}
      };
      
      // Extraer solo los campos que queremos actualizar
      if (bookData.titulo !== undefined) formattedData.data.titulo = bookData.titulo;
      if (bookData.autor !== undefined) formattedData.data.autor = bookData.autor;
      if (bookData.clasificacion !== undefined) formattedData.data.clasificacion = bookData.clasificacion;
      if (bookData.unidad !== undefined) formattedData.data.unidad = bookData.unidad;
      if (bookData.ubicacion !== undefined) formattedData.data.ubicacion = bookData.ubicacion;
      if (bookData.editorial !== undefined) formattedData.data.editorial = bookData.editorial;
      if (bookData.idlibro !== undefined) formattedData.data.idlibro = bookData.idlibro;
      
      console.log("Datos formateados para servidor:", JSON.stringify(formattedData, null, 2));
      
      // Construir URL para actualización usando documentId si está disponible
      const updateUrl = `http://localhost:1337/api/books/${documentId}`;
      console.log(`URL para actualización: ${updateUrl}`);
      
      // Realizar la petición al servidor directamente para mayor control
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en la respuesta (${response.status}):`, errorText);
        throw new Error(`Error al actualizar libro: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Respuesta del servidor:", JSON.stringify(result, null, 2));
      console.log("=== FIN DE ACTUALIZACIÓN DE LIBRO ===");
      
      return result;
    } catch (error) {
      console.error("Error actualizando libro:", error);
      console.log("=== FIN DE ACTUALIZACIÓN DE LIBRO (CON ERROR) ===");
      throw error;
    }
  },

  // Eliminar un libro
  deleteBook: async (id) => {
    console.log('Eliminando libro con ID:', id);
    return fetchAPI(`/api/books/${id}`, {
      method: 'DELETE',
    });
  }
}; 