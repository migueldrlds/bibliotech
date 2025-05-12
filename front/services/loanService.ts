import fetchAPI from '../lib/api';
import { formatISO } from 'date-fns';
import { bookService } from './bookService';

// Definir interfaces para los datos
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
}

export interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  Numcontrol: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  campus?: string;
  Carrera?: string;
  Genero?: string;
}

export interface Loan {
  id: number;
  documentId: string;
  fecha_prestamo: string;
  fecha_devolucion_esperada: string;
  fecha_devolucion_real: string | null;
  estado: 'activo' | 'renovado' | 'atrasado' | 'devuelto' | 'perdido';
  notas: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  campus_origen: string;
  multa?: number;
  renewalCount: number;
  dias_atraso: number;
  book: Book;
  usuario: User;
}

export interface LoanData {
  book: number | string;
  usuario: number | string;
  fecha_prestamo: string;
  fecha_devolucion_esperada: string;
  estado?: 'activo' | 'renovado' | 'atrasado' | 'devuelto' | 'perdido';
  notas?: string;
  fecha_devolucion_real?: string | null;
  campus_origen?: string;
  multa?: number;
  renewalCount?: number;
  dias_atraso?: number;
}

// Interfaz para el inventario
export interface Inventory {
  id: number;
  documentId: string;
  campus: string;
  Campus?: string;
  Cantidad: number;
  books: Book[];
}

export const loanService = {
  // Obtener todos los préstamos
  getLoans: async (): Promise<Loan[]> => {
    try {
      console.log("Solicitando lista de préstamos");
      
      // Usar populate más específico para asegurar que se obtienen todos los campos de usuario
      const response = await fetchAPI('/api/loans?populate[book][populate]=*&populate[usuario][populate]=*');
      
      console.log("Respuesta de préstamos:", response);
      
      // Procesar la respuesta para asegurar formato consistente
      let loans: Loan[] = [];
      if (response && response.data && Array.isArray(response.data)) {
        loans = response.data;
      } else if (Array.isArray(response)) {
        loans = response;
      }

      // Calcular multas automáticamente para préstamos atrasados
      await loanService.updateOverdueLoans(loans);

      return loans;
    } catch (error) {
      console.error("Error obteniendo préstamos:", error);
      throw error;
    }
  },

  // Obtener un préstamo por ID
  getLoan: async (id: number | string, documentId?: string): Promise<Loan> => {
    try {
      // Si tenemos el documentId, usarlo en lugar del id numérico
      const idToUse = documentId || id;
      
      console.log(`Obteniendo préstamo ${documentId ? 'documentId' : 'ID'}: ${idToUse}`);
      const response = await fetchAPI(`/api/loans/${idToUse}?populate[0]=book&populate[1]=usuario`);
      
      // Compatibilidad con ambos formatos de respuesta
      let loan;
      if (response && response.data) {
        loan = response.data;
      } else if (response && response.id) {
        loan = response;
      } else {
        throw new Error("Préstamo no encontrado o formato de respuesta inesperado");
      }

      // Verificar y actualizar multa automáticamente si está atrasado
      if (loan.estado === 'activo' || loan.estado === 'renovado' || loan.estado === 'atrasado') {
        const dueDate = new Date(loan.fecha_devolucion_esperada);
        const today = new Date();
        
        if (dueDate < today) {
          // Calcular días de atraso y multa
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const fine = diffDays * 5; // $5 por día de atraso
          
          console.log(`Préstamo ID ${loan.id} - Días atrasados: ${diffDays}, Multa calculada: $${fine}`);
          console.log(`Estado actual: ${loan.estado}, Multa actual: ${loan.multa}, Días atraso actual: ${loan.dias_atraso}`);
          
          // Siempre actualizar con los valores calculados correctamente
          await fetchAPI(`/api/loans/${idToUse}`, {
            method: 'PUT',
            body: JSON.stringify({ 
              data: {
                estado: 'atrasado',
                dias_atraso: diffDays,
                multa: fine
              }
            }),
          });
          
          // Actualizar el objeto del préstamo con los nuevos valores
          loan.estado = 'atrasado';
          loan.dias_atraso = diffDays;
          loan.multa = fine;
          
          console.log(`Préstamo ID ${loan.id} actualizado a: Multa $${fine}, Días atraso ${diffDays}`);
        }
      }

      return loan;
    } catch (error) {
      console.error(`Error obteniendo préstamo ${documentId ? 'documentId' : 'ID'} ${id}:`, error);
      throw error;
    }
  },

  // Obtener préstamos por usuario ID
  getLoansByUser: async (userId: number | string): Promise<Loan[]> => {
    try {
      console.log(`Obteniendo préstamos para el usuario ID: ${userId}`);
      // Filtrar por ID de usuario y usar el formato URL-encoded de populate
      const response = await fetchAPI(`/api/loans?filters[usuario]=${userId}&populate[0]=book&populate[1]=usuario`);
      
      // Procesar la respuesta
      let loans: Loan[] = [];
      if (response && response.data && Array.isArray(response.data)) {
        loans = response.data;
      } else if (Array.isArray(response)) {
        loans = response;
      }
      
      return loans;
    } catch (error) {
      console.error(`Error obteniendo préstamos para usuario ID ${userId}:`, error);
      throw error;
    }
  },

  // Obtener inventario
  getInventories: async (): Promise<Inventory[]> => {
    try {
      console.log("Obteniendo inventarios");
      const response = await fetchAPI('/api/inventories?populate=*');
      
      let inventories: Inventory[] = [];
      if (response && response.data && Array.isArray(response.data)) {
        inventories = response.data;
      } else if (Array.isArray(response)) {
        inventories = response;
      }
      
      return inventories;
    } catch (error) {
      console.error("Error obteniendo inventarios:", error);
      throw error;
    }
  },
  
  // Actualizar cantidad en inventario
  updateInventoryQuantity: async (inventoryId: number | string, cantidad: number, documentId?: string): Promise<any> => {
    try {
      // SIEMPRE usar documentId si está disponible
      const idToUse = documentId || inventoryId;
      
      console.log(`Actualizando inventario con ID: ${idToUse} a cantidad: ${cantidad}`);
      
      // Imprimir la URL completa para depuración
      const url = `/api/inventories/${idToUse}`;
      console.log(`URL de actualización de inventario: ${url}`);
      
      try {
        const response = await fetchAPI(url, {
          method: 'PUT',
          body: JSON.stringify({
            data: { Cantidad: cantidad }
          }),
        });
        
        console.log("Inventario actualizado con éxito:", response);
        return response;
      } catch (error) {
        console.error(`Error al actualizar inventario con ID ${idToUse}:`, error);
        
        // Si el error es 404, intentar obtener el documentId correcto
        console.log("Intentando recuperarse del error 404...");
        
        // Obtener todos los inventarios para tratar de encontrar el correcto
        const inventoriesResponse = await loanService.getInventories();
        console.log(`Obtenidos ${inventoriesResponse.length} inventarios para buscar coincidencia`);
        
        // Buscar el inventario que coincida con el ID proporcionado
        const foundInventory = inventoriesResponse.find(inv => {
          const invId = String(inv.id);
          const invDocId = inv.documentId;
          const searchId = String(inventoryId);
          
          return invId === searchId || invDocId === documentId;
        });
        
        if (foundInventory) {
          // Si hemos encontrado un inventario que coincide, intentar con su documentId
          const inventoryDocumentId = foundInventory.documentId;
          
          if (inventoryDocumentId) {
            console.log(`Reintentando con documentId: ${inventoryDocumentId}`);
            const altResponse = await fetchAPI(`/api/inventories/${inventoryDocumentId}`, {
              method: 'PUT',
              body: JSON.stringify({
                data: { Cantidad: cantidad }
              }),
            });
            console.log("Inventario actualizado con éxito usando documentId:", altResponse);
            return altResponse;
          }
        }
        
        throw error;
      }
    } catch (error) {
      console.error(`Error al actualizar inventario ID ${inventoryId}:`, error);
      throw error;
    }
  },

  // Crear un préstamo con gestión de campus
  createLoan: async (loanData: any): Promise<any> => {
    try {
      console.log("=== INICIO DE CREACIÓN DE PRÉSTAMO ===");
      console.log("Datos recibidos para crear préstamo:", loanData);

      // Verificar disponibilidad del libro
      console.log("Verificando disponibilidad del libro ID:", loanData.book);
      const book = await bookService.getBook(loanData.book);
      
      if (!book) {
        throw new Error(`Libro con ID ${loanData.book} no encontrado`);
      }

      // Formatear datos para la API
      const formattedData = {
        data: {
          book: loanData.book,
          usuario: loanData.usuario,
          fecha_prestamo: loanData.fecha_prestamo,
          fecha_devolucion_esperada: loanData.fecha_devolucion_esperada,
          estado: loanData.estado,
          campus_origen: loanData.campus_origen,
          notas: loanData.notas || ''
        }
      };

      console.log("Datos formateados para crear préstamo:", formattedData);

      // Crear el préstamo
      const response = await fetchAPI('/api/loans', {
        method: 'POST',
        body: JSON.stringify(formattedData)
      });

      console.log("Préstamo creado con respuesta:", response);

      // Actualizar inventario usando bookService
      if (loanData.campus_origen) {
        try {
          console.log("Actualizando inventario con bookService");
          await bookService.updateBookInventory(
            loanData.book,
            loanData.campus_origen,
            -1 // Reducir en 1 la cantidad
          );
          console.log("Inventario actualizado correctamente con bookService");
        } catch (inventoryError) {
          console.error("Error al actualizar inventario con bookService:", inventoryError);
          // No lanzamos el error aquí para no interrumpir la creación del préstamo
          // pero registramos el error para seguimiento
        }
      } else {
        console.warn("No se especificó campus_origen, no se actualizará el inventario");
      }

      return response;
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      throw error;
    } finally {
      console.log("=== FIN DE CREACIÓN DE PRÉSTAMO ===");
    }
  },

  // Actualizar un préstamo existente
  updateLoan: async (id: number | string, loanData: Partial<LoanData>, documentId?: string): Promise<any> => {
    try {
      const formattedData: { data: Partial<LoanData> } = {
        data: {}
      };

      // Solo incluir los campos que se quieren actualizar
      if (loanData.book !== undefined) formattedData.data.book = loanData.book;
      if (loanData.usuario !== undefined) formattedData.data.usuario = loanData.usuario;
      if (loanData.fecha_prestamo !== undefined) formattedData.data.fecha_prestamo = loanData.fecha_prestamo;
      if (loanData.fecha_devolucion_esperada !== undefined) formattedData.data.fecha_devolucion_esperada = loanData.fecha_devolucion_esperada;
      if (loanData.fecha_devolucion_real !== undefined) formattedData.data.fecha_devolucion_real = loanData.fecha_devolucion_real;
      if (loanData.estado !== undefined) formattedData.data.estado = loanData.estado;
      if (loanData.notas !== undefined) formattedData.data.notas = loanData.notas;
      if (loanData.campus_origen !== undefined) formattedData.data.campus_origen = loanData.campus_origen;

      // Si tenemos el documentId, usarlo en lugar del id numérico
      const idToUse = documentId || id;

      console.log(`Actualizando préstamo ${documentId ? 'documentId' : 'ID'}: ${idToUse} con datos:`, formattedData);
      const response = await fetchAPI(`/api/loans/${idToUse}`, {
        method: 'PUT',
        body: JSON.stringify(formattedData),
      });

      return response;
    } catch (error) {
      console.error(`Error al actualizar préstamo ID ${id}:`, error);
      throw error;
    }
  },

  // Renovar un préstamo (actualizar fecha y cambiar estado)
  renewLoan: async (id: number | string, newReturnDate: string, documentId?: string): Promise<any> => {
    try {
      console.log(`Renovando préstamo ${documentId ? 'documentId' : 'ID'}: ${id}`);
      
      // Obtener el préstamo actual para conocer el renewalCount actual
      const currentLoan = await loanService.getLoan(id, documentId);
      
      // Calcular el nuevo contador de renovaciones
      const currentRenewalCount = currentLoan.renewalCount || 0;
      const newRenewalCount = currentRenewalCount + 1;
      
      console.log(`Incrementando contador de renovaciones de ${currentRenewalCount} a ${newRenewalCount}`);
      
      // Preparar datos para la actualización
      const updateData = {
        fecha_devolucion_esperada: newReturnDate,
        estado: 'renovado' as 'renovado',
        renewalCount: newRenewalCount
      };
      
      // Actualizar el préstamo
      const idToUse = documentId || id;
      const response = await fetchAPI(`/api/loans/${idToUse}`, {
        method: 'PUT',
        body: JSON.stringify({ data: updateData }),
      });
      
      console.log('Préstamo renovado:', response);
      return response;
    } catch (error) {
      console.error(`Error al renovar préstamo ID ${id}:`, error);
      throw error;
    }
  },
  
  // Marcar un préstamo como devuelto
  returnLoan: async (id: number | string, documentId?: string): Promise<any> => {
    try {
      console.log(`Marcando préstamo ${documentId ? 'documentId' : 'ID'}: ${id} como devuelto`);
      
      // Obtener información actual del préstamo
      const loan = await loanService.getLoan(id, documentId);
      
      // Preparar datos para la actualización
      const updateData: {
        estado: 'devuelto',
        fecha_devolucion_real: string,
        multa?: number,
        dias_atraso?: number
      } = {
        estado: 'devuelto',
        fecha_devolucion_real: formatISO(new Date())
      };
      
      // Si el préstamo estaba atrasado, calcular multa y días de atraso
      if (loan.estado === 'atrasado') {
        const dueDate = new Date(loan.fecha_devolucion_esperada);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Multa de $5 MXN por día de atraso
        const fine = diffDays * 5;
        updateData.multa = fine;
        updateData.dias_atraso = diffDays;
      }
      
      // Actualizar el préstamo
      const idToUse = documentId || id;
      const response = await fetchAPI(`/api/loans/${idToUse}`, {
        method: 'PUT',
        body: JSON.stringify({ data: updateData }),
      });
      
      // Si hay un campus de origen, actualizar el inventario
      if (loan.campus_origen) {
        try {
          // Primero intentar usar bookService que ahora funciona correctamente
          try {
            if (loan.book) {
              const bookIdToUse = loan.book.documentId || loan.book.id;
              await bookService.updateBookInventory(
                bookIdToUse,
                loan.campus_origen,
                1  // Incrementar en 1 la cantidad disponible
              );
              console.log(`Inventario de campus ${loan.campus_origen} actualizado correctamente usando bookService`);
              return response;
            }
          } catch (bookServiceError) {
            console.error("Error al actualizar con bookService, intentando método alternativo:", bookServiceError);
          }
          
          // Si falla bookService, continuamos con el método anterior
          // Obtener el inventario del campus
          const inventoriesResponse = await loanService.getInventories();
          const campusInventory = inventoriesResponse.find(inv => {
            // Comprobar si inv y sus propiedades están definidas antes de usarlas
            const invCampus = inv?.campus || inv?.Campus || '';
            const bookMatches = inv?.books && Array.isArray(inv.books) && 
              inv.books.some(book => String(book?.id) === String(loan.book?.id));
            
            return invCampus.toLowerCase() === (loan.campus_origen || '').toLowerCase() && bookMatches;
          });
          
          if (campusInventory) {
            try {
              // Usar un ID válido para actualizar
              const inventoryId = campusInventory.documentId || campusInventory.id;
              
              if (!inventoryId) {
                throw new Error("No se encontró un ID válido para el inventario");
              }
              
              // Incrementar la cantidad disponible
              await loanService.updateInventoryQuantity(
                inventoryId, 
                campusInventory.Cantidad + 1,
                typeof inventoryId === 'string' ? inventoryId : undefined
              );
              console.log(`Inventario de campus ${loan.campus_origen} incrementado a ${campusInventory.Cantidad + 1}`);
            } catch (updateError) {
              console.error("Error en primer intento de actualización de inventario en devolución:", updateError);
              
              // Intentar obtener todos los inventarios de nuevo para buscar el documentId correcto
              const refreshedInventories = await loanService.getInventories();
              const refreshedInventory = refreshedInventories.find(inv => {
                // Comprobar si inv y sus propiedades están definidas antes de usarlas
                const invCampus = inv?.campus || inv?.Campus || '';
                const bookMatches = inv?.books && Array.isArray(inv.books) && 
                  inv.books.some(book => String(book?.id) === String(loan.book?.id));
                
                return invCampus.toLowerCase() === (loan.campus_origen || '').toLowerCase() && bookMatches;
              });
              
              if (refreshedInventory) {
                const inventoryId = refreshedInventory.documentId || refreshedInventory.id;
                
                if (inventoryId) {
                  console.log(`Reintentando con ID encontrado: ${inventoryId}`);
                  await loanService.updateInventoryQuantity(
                    inventoryId,
                    refreshedInventory.Cantidad + 1,
                    typeof inventoryId === 'string' ? inventoryId : undefined
                  );
                  console.log(`Inventario actualizado en segundo intento con ID: ${inventoryId}`);
                } else {
                  throw new Error("No se pudo encontrar un ID válido para el inventario en devolución");
                }
              } else {
                throw new Error("No se pudo encontrar el inventario para el campus y libro");
              }
            }
          } else {
            console.warn(`No se encontró el inventario para el campus ${loan.campus_origen}`);
          }
        } catch (invError) {
          console.error("Error al actualizar inventario:", invError);
          // Continuamos con la devolución aún si hay error en inventario
        }
      }
      
      console.log('Préstamo marcado como devuelto:', response);
      return response;
    } catch (error) {
      console.error(`Error al devolver préstamo ID ${id}:`, error);
      throw error;
    }
  },

  checkOverdueLoans: async (): Promise<number> => {
    try {
      console.log("Verificando préstamos atrasados");
      const loans = await loanService.getLoans();
      const now = new Date();
      let updatedCount = 0;
      
      // Filtrar préstamos activos o renovados con fecha de devolución vencida
      const overdueLoans = loans.filter(loan => 
        (loan.estado === 'activo' || loan.estado === 'renovado') && 
        new Date(loan.fecha_devolucion_esperada) < now
      );
      
      console.log(`Encontrados ${overdueLoans.length} préstamos atrasados`);
      
      // Actualizar cada préstamo a estado 'atrasado'
      for (const loan of overdueLoans) {
        const dueDate = new Date(loan.fecha_devolucion_esperada);
        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calcular la multa: $5 por día de atraso
        const fine = diffDays * 5;
        
        const updateData = {
          estado: 'atrasado' as 'atrasado',
          dias_atraso: diffDays,
          multa: fine
        };
        
        await fetchAPI(`/api/loans/${loan.documentId || loan.id}`, {
          method: 'PUT',
          body: JSON.stringify({ data: updateData }),
        });
        
        updatedCount++;
      }
      
      console.log(`Se actualizaron ${updatedCount} préstamos a estado 'atrasado'`);
      return updatedCount;
    } catch (error) {
      console.error('Error al verificar préstamos atrasados:', error);
      throw error;
    }
  },

  // Marcar un préstamo como perdido
  markAsLost: async (id: number | string, documentId?: string): Promise<any> => {
    try {
      console.log(`Marcando préstamo ${documentId ? 'documentId' : 'ID'}: ${id} como perdido`);
      
      // Preparar datos para la actualización
      const updateData = {
        estado: 'perdido' as 'perdido',
        fecha_devolucion_real: formatISO(new Date())
      };
      
      // Actualizar el préstamo
      const idToUse = documentId || id;
      const response = await fetchAPI(`/api/loans/${idToUse}`, {
        method: 'PUT',
        body: JSON.stringify({ data: updateData }),
      });
      
      console.log('Préstamo marcado como perdido:', response);
      return response;
    } catch (error) {
      console.error(`Error al marcar préstamo ID ${id} como perdido:`, error);
      throw error;
    }
  },

  // Calcular multa por atraso
  calculateFine: (returnDate: string, actualReturnDate: string | null, existingFine?: number, existingDaysLate?: number): { amount: number; daysLate: number } => {
    // Si ya existe una multa y días de atraso, podemos devolverla sin recalcular
    if (existingFine !== undefined && existingFine > 0 && existingDaysLate !== undefined && existingDaysLate > 0) {
      console.log(`Usando multa existente: $${existingFine} por ${existingDaysLate} días`);
      return {
        daysLate: existingDaysLate,
        amount: existingFine
      };
    }

    const today = actualReturnDate ? new Date(actualReturnDate) : new Date();
    const dueDate = new Date(returnDate);
    const daysLate = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    const amount = daysLate * 5; // $5 por día de atraso
    
    console.log(`Calculando nueva multa: $${amount} por ${daysLate} días`);
    return {
      daysLate,
      amount
    };
  },

  // Sincronizar multa con el backend para un préstamo
  syncFineWithBackend: async (loanId: number | string, documentId?: string): Promise<{ multa: number; dias_atraso: number }> => {
    try {
      console.log(`Sincronizando multa para préstamo ${documentId ? 'documentId' : 'ID'}: ${loanId}`);
      
      // Llamar al nuevo endpoint específico para cálculo de multas
      const idToUse = documentId || loanId;
      const endpoint = `/api/calculate-fine/${idToUse}`;
      
      try {
        // Intentar usar el endpoint específico
        console.log(`Usando endpoint específico para cálculo de multas: ${endpoint}`);
        const response = await fetchAPI(endpoint, {
          method: 'GET'
        });
        
        console.log('Respuesta del cálculo de multa:', response);
        
        // Verificar si la respuesta contiene los datos esperados
        if (response && typeof response.multa === 'number' && typeof response.dias_atraso === 'number') {
          return {
            multa: response.multa,
            dias_atraso: response.dias_atraso
          };
        }
        
        console.log('El endpoint específico no devolvió el formato esperado, usando método alternativo');
        throw new Error('Formato de respuesta no válido');
      } catch (error) {
        // Si falla el endpoint específico, usar el método alternativo (fallback)
        console.log('Error o endpoint específico no disponible, usando método alternativo:', error);
        
        // Obtener información actual del préstamo
        const loan = await loanService.getLoan(loanId, documentId);
        
        // Si no está atrasado ni tiene fecha vencida, no aplica multa
        const today = new Date();
        const dueDate = new Date(loan.fecha_devolucion_esperada);
        
        // Revisar si está atrasado según la fecha, independientemente del estado en sistema
        const isOverdue = dueDate < today;
        
        // Si está atrasado, siempre calcular y actualizar la multa
        if (isOverdue) {
          // Calcular días de atraso y multa
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const fine = diffDays * 5; // $5 por día de atraso
          
          console.log(`Calculando multa para préstamo atrasado: $${fine} por ${diffDays} días`);
          console.log(`Estado actual: ${loan.estado}, Multa actual: ${loan.multa}, Días atraso actual: ${loan.dias_atraso}`);
          
          // Actualizar en el backend
          const updateData = {
            estado: 'atrasado' as 'atrasado',
            dias_atraso: diffDays,
            multa: fine
          };
          
          await fetchAPI(`/api/loans/${idToUse}`, {
            method: 'PUT',
            body: JSON.stringify({ data: updateData }),
          });
          
          console.log(`Préstamo actualizado a estado 'atrasado' con multa: $${fine}`);
          
          return {
            multa: fine,
            dias_atraso: diffDays
          };
        }
        
        // Si no está atrasado, no hay multa
        return {
          multa: 0,
          dias_atraso: 0
        };
      }
    } catch (error) {
      console.error(`Error al sincronizar multa para préstamo ID ${loanId}:`, error);
      throw error;
    }
  },
  
  // Calcular multas para todos los préstamos atrasados
  calculateAllFines: async (): Promise<{ totalUpdated: number; details: any[] }> => {
    try {
      console.log("Calculando multas para todos los préstamos atrasados");
      
      // Intentar usar el endpoint específico
      try {
        const response = await fetchAPI('/api/calculate-all-fines', {
          method: 'POST'
        });
        
        console.log('Respuesta del cálculo de todas las multas:', response);
        return response;
      } catch (error) {
        console.error('Error al usar endpoint específico para cálculo de multas masivo:', error);
        
        // Método alternativo - obtener todos los préstamos y calcular multas uno por uno
        const loans = await loanService.getLoans();
        const now = new Date();
        const details: any[] = [];
        let totalUpdated = 0;
        
        // Filtrar préstamos activos o renovados con fecha de devolución vencida
        const overdueLoans = loans.filter(loan => 
          (loan.estado === 'activo' || loan.estado === 'renovado' || loan.estado === 'atrasado') && 
          new Date(loan.fecha_devolucion_esperada) < now
        );
        
        console.log(`Encontrados ${overdueLoans.length} préstamos atrasados`);
        
        // Actualizar cada préstamo a estado 'atrasado'
        for (const loan of overdueLoans) {
          try {
            const result = await loanService.syncFineWithBackend(loan.id, loan.documentId);
            details.push({
              id: loan.id,
              documentId: loan.documentId,
              multa: result.multa,
              dias_atraso: result.dias_atraso,
              libro: loan.book?.titulo || 'Desconocido',
              usuario: loan.usuario?.username || 'Desconocido',
              fecha_vencimiento: loan.fecha_devolucion_esperada
            });
            totalUpdated++;
          } catch (err) {
            console.error(`Error al calcular multa para préstamo ID ${loan.id}:`, err);
          }
        }
        
        return {
          totalUpdated,
          details
        };
      }
    } catch (error) {
      console.error('Error al calcular todas las multas:', error);
      throw error;
    }
  },

  // Nueva función para actualizar automáticamente los préstamos atrasados
  updateOverdueLoans: async (loans: Loan[]): Promise<void> => {
    try {
      console.log("Verificando préstamos atrasados automáticamente");
      const today = new Date();
      const updatedLoans = [];
      
      // Procesar cada préstamo
      for (const loan of loans) {
        try {
          // Solo procesar préstamos activos, renovados o ya atrasados
          if (loan.estado !== 'activo' && loan.estado !== 'renovado' && loan.estado !== 'atrasado') {
            continue;
          }
          
          const dueDate = new Date(loan.fecha_devolucion_esperada);
          
          // Verificar si está atrasado (la fecha de devolución es anterior a hoy)
          if (dueDate < today) {
            // Calcular días de atraso y multa
            const diffTime = Math.abs(today.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // SIEMPRE calcular la multa como $5 por día, nunca usar un valor diferente
            const fine = diffDays * 5; // $5 por día de atraso
            
            console.log(`Préstamo ID ${loan.id} - Días atrasados: ${diffDays}, Multa calculada: $${fine}`);
            console.log(`Estado actual: ${loan.estado}, Multa actual: ${loan.multa}, Días atraso actual: ${loan.dias_atraso}`);
            
            // FORZAR actualización en todos los préstamos atrasados
            // No confiar en los valores anteriores para decidir si actualizar o no
            const idToUse = loan.documentId || loan.id;
            
            // Siempre actualizar con los valores calculados correctamente
            await fetchAPI(`/api/loans/${idToUse}`, {
              method: 'PUT',
              body: JSON.stringify({ 
                data: {
                  estado: 'atrasado',
                  dias_atraso: diffDays,
                  multa: fine
                }
              }),
            });
            
            // Actualizar el objeto del préstamo en lugar
            loan.estado = 'atrasado';
            loan.dias_atraso = diffDays;
            loan.multa = fine;
            
            console.log(`Préstamo ID ${loan.id} actualizado a: Multa $${fine}, Días atraso ${diffDays}`);
            
            updatedLoans.push({
              id: loan.id,
              documentId: loan.documentId,
              titulo: loan.book?.titulo || 'Desconocido',
              usuario: loan.usuario?.username || 'Desconocido',
              diasAtraso: diffDays,
              multa: fine
            });
          }
        } catch (err) {
          console.error(`Error al procesar préstamo ID ${loan.id}:`, err);
        }
      }
      
      if (updatedLoans.length > 0) {
        console.log(`Se actualizaron automáticamente ${updatedLoans.length} préstamos atrasados:`, updatedLoans);
      }
    } catch (error) {
      console.error("Error al actualizar préstamos atrasados:", error);
    }
  }
}