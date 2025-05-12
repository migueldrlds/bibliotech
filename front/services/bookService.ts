import fetchAPI from '../lib/api';
import { API_BASE_URL } from '../lib/config';

// Define tipos para libro
export interface Book {
  id: number;
  documentId: string;
  id_libro: string;
  titulo: string;
  autor: string;
  clasificacion: string;
  unidad: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  // Campos adicionales que pueden estar en la respuesta
  loanHistory?: any[];
  campus?: string;
  // Información del inventario
  inventory?: {
    id: number;
    documentId: string;
    Campus: string;
    Cantidad: number;
  };
  // Añadir soporte para múltiples inventarios
  inventories?: {
    id: number;
    documentId: string;
    Campus: string;
    Cantidad: number;
  }[];
  // Inventario agrupado por campus (para UI)
  inventario?: {
    campus: string;
    cantidad: number;
  }[];
}

// Función para mapear los datos del servidor a la estructura esperada
const mapBookData = (bookData: any): Book | null => {
  if (!bookData) return null;
  
  // Procesar inventarios si existen en el formato de respuesta
  let inventories = undefined;
  if (bookData.inventories && Array.isArray(bookData.inventories)) {
    inventories = bookData.inventories.map((inv: any) => ({
      id: inv.id,
      documentId: inv.documentId || inv.attributes?.documentId || '',
      Campus: inv.Campus || inv.attributes?.Campus || '',
      Cantidad: inv.Cantidad || inv.attributes?.Cantidad || 0
    }));
  } else if (bookData.attributes?.inventories?.data && Array.isArray(bookData.attributes.inventories.data)) {
    // Formato Strapi 5
    inventories = bookData.attributes.inventories.data.map((inv: any) => ({
      id: inv.id,
      documentId: inv.attributes?.documentId || '',
      Campus: inv.attributes?.Campus || '',
      Cantidad: inv.attributes?.Cantidad || 0
    }));
  }
  
  // Asegurarse de incluir tanto id como id_libro
  return {
    id: bookData.id, // ID numérico real en la base de datos
    documentId: bookData.documentId || bookData.attributes?.documentId || '',
    id_libro: bookData.id_libro || bookData.attributes?.id_libro || bookData.id?.toString() || '',
    unidad: bookData.inventory?.Cantidad || bookData.attributes?.inventory?.Cantidad || 0, 
    titulo: bookData.titulo || bookData.attributes?.titulo || bookData.title || bookData.attributes?.title || '',
    autor: bookData.autor || bookData.attributes?.autor || bookData.author || bookData.attributes?.author || '',
    clasificacion: bookData.clasificacion || bookData.attributes?.clasificacion || 
                   bookData.genre || bookData.attributes?.genre || '',
    createdAt: bookData.createdAt || bookData.attributes?.createdAt,
    updatedAt: bookData.updatedAt || bookData.attributes?.updatedAt,
    publishedAt: bookData.publishedAt || bookData.attributes?.publishedAt,
    campus: bookData.campus || bookData.attributes?.campus || 
            bookData.inventory?.Campus || bookData.attributes?.inventory?.Campus || '', 
    inventory: bookData.inventory ? {
      id: bookData.inventory.id,
      documentId: bookData.inventory.documentId || bookData.inventory.attributes?.documentId || '',
      Campus: bookData.inventory.Campus || bookData.inventory.attributes?.Campus || '',
      Cantidad: bookData.inventory.Cantidad || bookData.inventory.attributes?.Cantidad || 0
    } : undefined,
    inventories: inventories,
    // Si inventario ya viene procesado, usarlo directamente
    inventario: bookData.inventario || undefined
  };
};

// Definir interfaz para la respuesta
interface BookResponse {
  data: Book[];
  meta: any;
}

export const bookService = {
  // Obtener todos los libros
  getBooks: async (filters = {}): Promise<BookResponse> => {
    try {
      console.log('Obteniendo todos los libros con filtros:', filters);
      
      // Construir URL con parámetros de filtro si existen
      let url = '/api/books?populate=*';
      
      if (Object.keys(filters).length > 0) {
        // Convertir filtros a formato de parámetros URL
        const queryParams = Object.entries(filters)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        
        url = `${url}&${queryParams}`;
      }
      
      const response = await fetchAPI(url);
      
      return {
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.meta
      };
    } catch (error) {
      console.error('Error al obtener libros:', error);
      return { data: [], meta: null };
    }
  },
  
  // Búsqueda avanzada de libros (con soporte para paginación y búsqueda por término)
  searchBooks: async (queryParams: string): Promise<BookResponse> => {
    try {
      console.log('Realizando búsqueda avanzada de libros con parámetros:', queryParams);
      
      // Construir URL con parámetros enviados
      let url = '/api/books?populate=*';
      
      if (queryParams) {
        url = `${url}&${queryParams}`;
      }
      
      const response = await fetchAPI(url);
      
      return {
        data: Array.isArray(response.data) ? response.data : [],
        meta: response.meta
      };
    } catch (error) {
      console.error('Error en búsqueda avanzada de libros:', error);
      return { data: [], meta: null };
    }
  },

  // Obtener un libro con todos sus inventarios
  getBookWithInventories: async (id: number | string): Promise<Book | null> => {
    try {
      console.log(`Obteniendo libro ID: ${id} con todos sus inventarios`);
      
      // 1. Obtener primero el libro básico para tener el documentId
      const basicBook = await bookService.getBook(id);
      if (!basicBook || !basicBook.documentId) {
        throw new Error(`Libro con ID ${id} no encontrado o sin documentId válido`);
      }
      
      // 2. Usar el documentId para una consulta completa incluyendo inventarios
      const url = `/api/books/${basicBook.documentId}?populate[0]=inventories`;
      
      console.log("URL de la solicitud:", url);
      const response = await fetchAPI(url);
      
      if (!response || !response.data) {
        throw new Error(`No se pudo obtener el libro con ID ${id} e inventarios`);
      }
      
      // 3. Procesar según el formato de la respuesta
      const bookData = response.data.attributes 
        ? { id: response.data.id, ...response.data.attributes }
        : response.data;
        
      // 4. Mapear la respuesta al formato esperado por la aplicación  
      const book = mapBookData(bookData);
      
      // 5. Procesar explícitamente los inventarios para la UI
      if (book) {
        // Cargar los inventarios consolidados para UI usando la función dedicada
        book.inventario = await bookService.procesarInventariosParaLibro(basicBook.documentId);
      }
      
      // Registrar lo que hemos encontrado
      if (book?.inventario) {
        console.log(`Inventario consolidado para ${book.titulo}:`, 
          book.inventario.map(inv => `${inv.campus}: ${inv.cantidad}`).join(', '));
      }
      
      return book;
    } catch (error) {
      console.error(`Error obteniendo libro ID ${id} con inventarios:`, error);
      throw error;
    }
  },

  // Obtener un libro por ID
  getBook: async (id: number | string): Promise<Book | null> => {
    try {
      console.log(`Obteniendo libro ID: ${id}`);
      
      // Si el ID es numérico, intentamos obtener el libro por documentId primero
      if (typeof id === 'number' || /^\d+$/.test(id.toString())) {
        console.log(`ID numérico detectado: ${id}, intentando obtener por documentId primero`);
        
        // Intentar obtener el libro por documentId
        try {
          const url = `/api/books/${id}?populate=*`;
          console.log("URL de la solicitud (documentId):", url);
          const response = await fetchAPI(url);
          
          if (response && response.data) {
            const bookData = response.data.attributes 
              ? { id: response.data.id, ...response.data.attributes }
              : response.data;
            const book = mapBookData(bookData);
            if (book) {
              console.log("Libro encontrado por documentId:", book.titulo);
              return book;
            }
          }
        } catch (error) {
          console.log(`No se pudo obtener el libro por documentId ${id}, intentando por ID numérico`);
        }
        
        // Si falló por documentId, intentar por ID numérico
        try {
          const url = `/api/books/${id}?populate=*`;
          console.log("URL de la solicitud (ID numérico):", url);
          const response = await fetchAPI(url);
          
          if (response && response.data) {
            const bookData = response.data.attributes 
              ? { id: response.data.id, ...response.data.attributes }
              : response.data;
            const book = mapBookData(bookData);
            if (book) {
              console.log("Libro encontrado por ID numérico:", book.titulo);
              return book;
            }
          }
        } catch (error) {
          console.log(`No se pudo obtener el libro por ID numérico ${id}`);
        }
        
        // Si ambos métodos fallaron, intentar buscar por id_libro
        try {
          console.log(`Intentando buscar libro por id_libro: ${id}`);
          const url = `/api/books?filters[id_libro][$eq]=${id}&populate=*`;
          console.log("URL de búsqueda por id_libro:", url);
          const response = await fetchAPI(url);
          
          if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            const bookData = response.data[0].attributes 
              ? { id: response.data[0].id, ...response.data[0].attributes }
              : response.data[0];
            const book = mapBookData(bookData);
            if (book) {
              console.log("Libro encontrado por id_libro:", book.titulo);
              return book;
            }
          }
        } catch (error) {
          console.log(`No se pudo obtener el libro por id_libro ${id}`);
        }
      } else {
        // Si no es numérico, tratar directamente como documentId
        const url = `/api/books/${id}?populate=*`;
        console.log("URL de la solicitud (documentId):", url);
        const response = await fetchAPI(url);
        
        if (response && response.data) {
          const bookData = response.data.attributes 
            ? { id: response.data.id, ...response.data.attributes }
            : response.data;
          const book = mapBookData(bookData);
          if (book) {
            console.log("Libro encontrado por documentId:", book.titulo);
            return book;
          }
        }
      }
      
      console.error(`No se encontró el libro con ID/documentId ${id} después de intentar todos los métodos`);
      return null;
      
    } catch (error) {
      console.error(`Error obteniendo libro ID ${id}:`, error);
      return null;
    }
  },

  // Crear un nuevo libro
  createBook: async (bookData: Partial<Book>): Promise<any> => {
    try {
      console.log('=== INICIO DE CREACIÓN DE LIBRO ===');
      console.log('Datos recibidos para crear libro:', bookData);
      
      // Asegurarse de que id_libro siempre sea un string, nunca null
      const id_libro = bookData.id_libro || `AUTO-${Date.now()}`;
      
      // Preparar los datos exactamente como los espera Strapi
      const serverData = {
        id_libro: id_libro,
        titulo: bookData.titulo || "",
        autor: bookData.autor || "",
        clasificacion: bookData.clasificacion || "",
        campus: bookData.campus || null
      };
      
      console.log('Datos formateados para crear libro:', serverData);
      
      const response = await fetchAPI('/api/books', {
        method: 'POST',
        body: JSON.stringify({ data: serverData }),
      });
      
      console.log('Respuesta al crear libro:', response);
      console.log('=== FIN DE CREACIÓN DE LIBRO ===');
      
      return response;
    } catch (error) {
      console.error('Error en createBook:', error);
      console.log('=== FIN DE CREACIÓN DE LIBRO (CON ERROR) ===');
      throw error;
    }
  },

  // Actualizar un libro existente
  updateBook: async (id: number | string, bookData: Partial<Book>, documentId?: string): Promise<any> => {
    try {
      console.log("=== INICIO DE ACTUALIZACIÓN DE LIBRO ===");
      console.log(`Actualizando libro con ID: ${id}`);
      console.log("Datos recibidos:", bookData);
      
      // Verificar si tenemos documentId
      const idToUse = documentId || id;
      console.log(`ID a usar para actualización: ${idToUse} (${documentId ? 'documentId' : 'id numérico'})`);
      
      // Preparar datos para Strapi en formato correcto
      const formattedData: { data: Partial<Book> } = {
        data: {}
      };
      
      // Extraer solo los campos que queremos actualizar
      if (bookData.titulo !== undefined) formattedData.data.titulo = bookData.titulo;
      if (bookData.autor !== undefined) formattedData.data.autor = bookData.autor;
      if (bookData.clasificacion !== undefined) formattedData.data.clasificacion = bookData.clasificacion;
      if (bookData.id_libro !== undefined) formattedData.data.id_libro = bookData.id_libro;
      if (bookData.campus !== undefined) formattedData.data.campus = bookData.campus;
      
      console.log("Datos formateados para actualización:", formattedData);
      
      const response = await fetchAPI(`/api/books/${idToUse}`, {
        method: 'PUT',
        body: JSON.stringify(formattedData),
      });
      
      console.log("Respuesta de actualización:", response);
      console.log("=== FIN DE ACTUALIZACIÓN DE LIBRO ===");
      
      return response;
    } catch (error) {
      console.error(`Error al actualizar libro ID ${id}:`, error);
      console.log("=== FIN DE ACTUALIZACIÓN DE LIBRO (CON ERROR) ===");
      throw error;
    }
  },

  // Eliminar un libro
  deleteBook: async (id: number | string): Promise<any> => {
    try {
      console.log(`Eliminando libro con ID: ${id}`);
      const response = await fetchAPI(`/api/books/${id}`, {
        method: 'DELETE',
      });
      console.log(`Libro ID ${id} eliminado con éxito:`, response);
      return response;
    } catch (error) {
      console.error(`Error al eliminar libro ID ${id}:`, error);
      throw error;
    }
  },
  
  // Actualizar el inventario de un libro en un campus específico
  updateBookInventory: async (
    bookId: number | string, 
    campus: string, 
    quantityChange: number
  ): Promise<any> => {
    try {
      console.log("=== INICIO DE ACTUALIZACIÓN DE INVENTARIO ===");
      console.log(`Actualizando inventario del libro ID: ${bookId}`);
      console.log(`Campus: ${campus}, Cambio: ${quantityChange}`);
      
      // 1. OBTENER EL LIBRO USANDO DOCUMENT ID
      let book = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          book = await bookService.getBook(bookId);
          if (book) break;
          
          console.log(`Intento ${retryCount + 1} de ${maxRetries} para obtener el libro`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Espera exponencial
          }
        } catch (error) {
          console.error(`Error en intento ${retryCount + 1} de obtener libro:`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
      
      if (!book) {
        console.error(`No se pudo obtener el libro después de ${maxRetries} intentos`);
        // Intentar una última búsqueda por id_libro
        try {
          console.log(`Realizando búsqueda final por id_libro: ${bookId}`);
          const url = `/api/books?filters[id_libro][$eq]=${bookId}&populate=*`;
          const response = await fetchAPI(url);
          
          if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            const bookData = response.data[0].attributes 
              ? { id: response.data[0].id, ...response.data[0].attributes }
              : response.data[0];
            book = mapBookData(bookData);
            if (book) {
              console.log("Libro encontrado en búsqueda final por id_libro:", book.titulo);
            }
          }
        } catch (error) {
          console.error("Error en búsqueda final por id_libro:", error);
        }
        
        if (!book) {
          return { 
            error: `No se pudo encontrar el libro con ID ${bookId} después de todos los intentos`,
            success: false
          };
        }
      }
      
      if (!book.documentId) {
        console.error(`El libro encontrado no tiene documentId válido`);
        return { 
          error: `El libro encontrado no tiene documentId válido`,
          success: false
        };
      }
      
      console.log("Libro encontrado:", book.titulo, "ID:", book.id, "DocumentID:", book.documentId);
      
      // 2. BUSCAR INVENTARIOS EXISTENTES
      const url = `/api/inventories?filters[Campus]=${encodeURIComponent(campus)}&filters[book][documentId]=${book.documentId}`;
      console.log(`Buscando inventarios para: ${url}`);
      
      let inventoriesResponse;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          inventoriesResponse = await fetchAPI(url);
          if (inventoriesResponse) break;
          
          console.log(`Intento ${retryCount + 1} de ${maxRetries} para obtener inventarios`);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        } catch (error) {
          console.error(`Error en intento ${retryCount + 1} de obtener inventarios:`, error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
      
      if (!inventoriesResponse) {
        console.error(`No se pudieron obtener los inventarios después de ${maxRetries} intentos`);
        return { 
          error: `No se pudieron obtener los inventarios después de ${maxRetries} intentos`,
          success: false
        };
      }
      
      // Verificar si hay inventarios existentes
      if (inventoriesResponse && inventoriesResponse.data && Array.isArray(inventoriesResponse.data)) {
        const inventories = inventoriesResponse.data;
        console.log(`Se encontraron ${inventories.length} inventarios para campus ${campus} y libro ${book.titulo}`);
        
        // Log detallado de cada inventario
        inventories.forEach((inv: { id: number; documentId: string | null; Campus: string; Cantidad: number }, index: number) => {
          console.log(`\nInventario #${index + 1}:`);
          console.log("ID:", inv.id);
          console.log("DocumentID:", inv.documentId);
          console.log("Campus:", inv.Campus);
          console.log("Cantidad:", inv.Cantidad);
        });
        
        // Si hay inventarios existentes, buscar uno con documentId
        if (inventories.length > 0) {
          // Primero intentar encontrar un inventario con documentId y cantidad > 0
          const inventoryWithDocId = inventories.find((inv: { documentId?: string; Cantidad: number }) => 
            inv.documentId && inv.Cantidad > 0
          );
          
          if (inventoryWithDocId) {
            console.log("Usando inventario con documentId:", inventoryWithDocId.documentId);
            const currentQuantity = inventoryWithDocId.Cantidad || 0;
            const newQuantity = Math.max(0, currentQuantity + quantityChange);
            
            console.log(`Actualizando inventario con documentId: ${inventoryWithDocId.documentId}`);
            console.log(`Cantidad actual: ${currentQuantity}, Nueva cantidad: ${newQuantity}`);
            
            try {
              const updateResponse = await fetchAPI(`/api/inventories/${inventoryWithDocId.documentId}`, {
                method: 'PUT',
                body: JSON.stringify({
                  data: {
                    Cantidad: newQuantity,
                    book: book.documentId // Asegurarnos de que el libro esté asociado
                  }
                }),
              });
              
              console.log("Inventario actualizado con éxito:", updateResponse);
              console.log("=== FIN DE ACTUALIZACIÓN DE INVENTARIO ===");
              
              return updateResponse;
            } catch (updateError) {
              console.error(`Error al actualizar inventario con documentId ${inventoryWithDocId.documentId}:`, updateError);
              throw new Error(`Error al actualizar inventario: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
            }
          } else {
            // Si no hay inventario con documentId y cantidad > 0, crear uno nuevo
            console.log("No se encontró inventario con documentId y cantidad > 0, creando uno nuevo");
            return await bookService.createNewInventory(book, campus, quantityChange);
          }
        }
      }
      
      // 3. SI NO EXISTE NINGÚN INVENTARIO, CREAR UNO NUEVO
      console.log(`No se encontró ningún inventario para campus ${campus} y libro ${book.documentId}. Creando nuevo.`);
      return await bookService.createNewInventory(book, campus, quantityChange);
      
    } catch (error) {
      console.error(`Error al actualizar inventario del libro ID ${bookId}:`, error);
      console.log("=== FIN DE ACTUALIZACIÓN DE INVENTARIO (CON ERROR) ===");
      throw error;
    }
  },

  // Función auxiliar para crear nuevo inventario
  createNewInventory: async (book: Book, campus: string, quantityChange: number): Promise<any> => {
    if (campus !== 'Tomas Aquino' && campus !== 'Otay') {
      console.error(`Campus ${campus} no válido. Debe ser 'Tomas Aquino' o 'Otay'`);
      throw new Error(`Campus ${campus} no válido. Debe ser 'Tomas Aquino' o 'Otay'`);
    }
    
    if (quantityChange <= 0) {
      console.log("No se crea inventario porque el cambio de cantidad es cero o negativo");
      return { message: "No action taken: quantity change is zero or negative" };
    }
    
    try {
      const createResponse = await fetchAPI('/api/inventories', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            book: book.documentId,
            Campus: campus,
            Cantidad: quantityChange
          }
        }),
      });
      
      console.log("Nuevo inventario creado con éxito:", createResponse);
      console.log("=== FIN DE ACTUALIZACIÓN DE INVENTARIO ===");
      
      return createResponse;
    } catch (createError) {
      console.error("Error al crear inventario:", createError);
      throw new Error(`Error al crear inventario: ${createError instanceof Error ? createError.message : String(createError)}`);
    }
  },

  // Procesar inventarios para un libro para mostrar en UI
  procesarInventariosParaLibro: async (bookId: number | string): Promise<{
    campus: string;
    cantidad: number;
  }[]> => {
    try {
      console.log(`Procesando inventarios para libro ID: ${bookId}`);
      
      // 1. Primero obtenemos el libro completo
      const book = await bookService.getBook(bookId);
      if (!book) {
        throw new Error(`Libro con ID ${bookId} no encontrado`);
      }
      
      // 2. Buscar todos los inventarios para este libro usando documentId
      const url = `/api/inventories?filters[book][documentId]=${book.documentId}&pagination[pageSize]=100`;
      console.log(`Buscando inventarios para libro: ${url}`);
      
      const inventoriesResponse = await fetchAPI(url);
      
      // Inicializamos un mapa para consolidar por campus
      const inventarioPorCampus = new Map<string, number>();
      
      // 3. Procesamos la respuesta
      if (inventoriesResponse && inventoriesResponse.data && Array.isArray(inventoriesResponse.data)) {
        const inventories = inventoriesResponse.data;
        console.log(`Se encontraron ${inventories.length} registros de inventario`);
        
        // Iteramos y consolidamos por campus
        for (const inventory of inventories) {
          // Acceso directo o a través de attributes según la respuesta API
          const campus = inventory.Campus || inventory.attributes?.Campus || 'Desconocido';
          const cantidad = parseInt(inventory.Cantidad || inventory.attributes?.Cantidad || 0);
          
          if (isNaN(cantidad)) continue; // Saltamos entradas con cantidad no válida
          
          // Si ya existe una entrada para este campus, sumamos las cantidades
          if (inventarioPorCampus.has(campus)) {
            inventarioPorCampus.set(campus, inventarioPorCampus.get(campus)! + cantidad);
          } else {
            // Si no existe, creamos una nueva entrada
            inventarioPorCampus.set(campus, cantidad);
          }
        }
      }
      
      // 4. Convertimos el mapa a un array para la UI
      const inventariosProcesados = Array.from(inventarioPorCampus).map(([campus, cantidad]) => ({
        campus,
        cantidad
      }));
      
      // 5. Ordenamos por campus para una presentación consistente
      inventariosProcesados.sort((a, b) => a.campus.localeCompare(b.campus));
      
      console.log(`Libro ${book.titulo} - Inventario procesado:`, inventariosProcesados);
      return inventariosProcesados;
    } catch (error) {
      console.error(`Error procesando inventarios para libro ID ${bookId}:`, error);
      return []; // Retornamos array vacío en caso de error
    }
  }
};