import fetchAPI from '../lib/api';
import { bookService } from './bookService';

export const loanService = {
  // Obtener todos los préstamos
  getLoans: async () => {
    try {
      console.log("Solicitando lista de préstamos");
      
      // Usar fetch directo para tener control total sobre el request
      const response = await fetch('http://localhost:1337/api/loans?populate=*');
      const data = await response.json();
      
      console.log("Respuesta completa del API:", JSON.stringify(data, null, 2));
      
      // Procesar la respuesta para asegurar formato consistente
      let loans = [];
      if (data && data.data && Array.isArray(data.data)) {
        console.log("Usando formato data[]");
        loans = data.data;
      } else if (Array.isArray(data)) {
        console.log("Usando formato array directo");
        loans = data;
      }

      // Verificar cada préstamo con más detalle
      loans.forEach((loan, index) => {
        console.log(`Préstamo #${index + 1}, ID: ${loan.id}, documentId: ${loan.documentId || 'no disponible'}`);
        
        // Verificar estructura del usuario
        if (loan.attributes && loan.attributes.usuario && loan.attributes.usuario.data) {
          console.log(`- Usuario (formato attributes): ${JSON.stringify(loan.attributes.usuario.data, null, 2)}`);
        } else if (loan.attributes && loan.attributes.usuario) {
          console.log(`- Usuario (formato attributes directo): ${JSON.stringify(loan.attributes.usuario, null, 2)}`);
        } else if (loan.usuario) {
          console.log(`- Usuario (formato directo): ${JSON.stringify(loan.usuario, null, 2)}`);
        } else {
          console.log('- No tiene usuario asignado');
        }
        
        // Verificar estructura del libro
        if (loan.attributes && loan.attributes.book && loan.attributes.book.data) {
          console.log(`- Libro (formato attributes): ${JSON.stringify(loan.attributes.book.data, null, 2)}`);
        } else if (loan.attributes && loan.attributes.book) {
          console.log(`- Libro (formato attributes directo): ${JSON.stringify(loan.attributes.book, null, 2)}`);
        } else if (loan.book) {
          console.log(`- Libro (formato directo): ${JSON.stringify(loan.book, null, 2)}`);
        } else {
          console.log('- No tiene libro asignado');
        }
      });
      
      return loans;
    } catch (error) {
      console.error("Error obteniendo préstamos:", error);
      throw error;
    }
  },

  // Obtener un préstamo por ID
  getLoan: async (id, documentId) => {
    try {
      // Si tenemos el documentId, usarlo en lugar del id numérico
      const idToUse = documentId || id;
      
      console.log(`Obteniendo préstamo ${documentId ? 'documentId' : 'ID'}: ${idToUse}`);
      const response = await fetchAPI(`/api/loans/${idToUse}?populate%5B0%5D=book&populate%5B1%5D=usuario`);
      console.log("Respuesta del API de préstamo específico:", response);
      // Compatibilidad con ambos formatos de respuesta
      if (response && response.data) {
        return response.data;
      } else if (response && response.id) {
        return response;
      } else {
        throw new Error("Préstamo no encontrado o formato de respuesta inesperado");
      }
    } catch (error) {
      console.error(`Error obteniendo préstamo ${documentId ? 'documentId' : 'ID'} ${id}:`, error);
      throw error;
    }
  },

  // Obtener préstamos por usuario ID
  getLoansByUser: async (userId) => {
    try {
      console.log(`Obteniendo préstamos para el usuario ID: ${userId}`);
      // Filtrar por ID de usuario y usar el formato URL-encoded de populate
      const response = await fetchAPI(`/api/loans?filters%5Busuario%5D=${userId}&populate%5B0%5D=book&populate%5B1%5D=usuario`);
      console.log("Respuesta de préstamos por usuario:", response);
      
      // Procesar la respuesta
      let loans = [];
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

  // Crear un préstamo
  createLoan: async (loanData) => {
    console.log('=== INICIO DE CREACIÓN DE PRÉSTAMO ===');
    console.log('Datos recibidos para crear préstamo:', JSON.stringify(loanData, null, 2));
    
    try {
      // Verificar si el libro tiene unidades disponibles
      if (loanData.book && loanData.book.id) {
        console.log(`Verificando disponibilidad del libro ID: ${loanData.book.id}`);
        const bookResponse = await bookService.getBook(loanData.book.id);
        console.log('Respuesta de getBook:', JSON.stringify(bookResponse, null, 2));
        
        if (bookResponse && bookResponse.data) {
          const book = bookResponse.data;
          const units = parseInt(book.unidad || '0', 10);
          console.log(`Unidades disponibles del libro: ${units}`);
          
          if (units <= 0) {
            console.error('No hay unidades disponibles para préstamo');
            throw new Error('No hay unidades disponibles de este libro para préstamo');
          }
          
          // Crear el préstamo
          const serverLoanData = {
            book: loanData.book.id,  // Asegurarse de que sea solo el ID
            usuario: loanData.usuario,
            fecha_prestamo: loanData.fecha_prestamo,
            fecha_devolucion_esperada: loanData.fecha_devolucion_esperada,
            estado: loanData.estado || 'activo',
            notas: loanData.notas || ''
          };
          
          console.log('Datos formateados para crear préstamo:', JSON.stringify(serverLoanData, null, 2));
          
          // Hacer la petición al servidor de Strapi directamente
          const response = await fetch('http://localhost:1337/api/loans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: serverLoanData })
          });
          
          const loanResponse = await response.json();
          console.log('Respuesta del servidor al crear préstamo:', JSON.stringify(loanResponse, null, 2));
          
          if (loanResponse.error) {
            throw new Error(`Error del servidor: ${loanResponse.error.message}`);
          }
          
          // Actualizar el inventario del libro (restar una unidad)
          try {
            console.log('Actualizando inventario del libro...');
            
            // Verificar si tenemos documentId
            if (!book.documentId) {
              console.error('El libro no tiene documentId, intentando obtenerlo');
              throw new Error('El libro no tiene documentId para actualizar el inventario');
            }
            
            const bookDocId = book.documentId;
            console.log(`Usando documentId del libro: ${bookDocId}`);
            
            const newUnits = Math.max(0, units - 1);
            console.log(`Unidades actuales: ${units}, Nuevas unidades: ${newUnits}`);
            
            const bookUpdateData = {
              data: {
                unidad: newUnits
              }
            };
            
            console.log('Datos para actualizar inventario:', JSON.stringify(bookUpdateData, null, 2));
            
            // Usar SIEMPRE documentId para la actualización
            const updateBookUrl = `http://localhost:1337/api/books/${bookDocId}`;
            console.log(`URL de actualización: ${updateBookUrl}`);
            
            const updateBookResponse = await fetch(updateBookUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(bookUpdateData)
            });
            
            if (!updateBookResponse.ok) {
              throw new Error(`Error HTTP al actualizar inventario: ${updateBookResponse.status}`);
            }
            
            const bookUpdateResult = await updateBookResponse.json();
            console.log('Respuesta de actualización de inventario:', JSON.stringify(bookUpdateResult, null, 2));
            
            if (bookUpdateResult.error) {
              console.error('Error al actualizar el inventario:', bookUpdateResult.error);
            } else {
              console.log(`Inventario actualizado correctamente. Nuevas unidades: ${
                bookUpdateResult.data?.attributes?.unidad || 
                bookUpdateResult.data?.unidad || 
                'N/A'
              }`);
            }
          } catch (inventoryError) {
            console.error('Error al actualizar el inventario:', inventoryError);
            // No revertimos el préstamo, pero registramos el error
          }
          
          console.log('=== FIN DE CREACIÓN DE PRÉSTAMO ===');
          return loanResponse;
        } else {
          console.error('No se pudo obtener información del libro');
          throw new Error('No se pudo obtener información del libro');
        }
      } else {
        console.error('Datos del libro no especificados correctamente');
        throw new Error('Datos del libro no especificados correctamente');
      }
    } catch (error) {
      console.error('Error en createLoan:', error);
      console.log('=== FIN DE CREACIÓN DE PRÉSTAMO (CON ERROR) ===');
      throw error;
    }
  },

  // Actualizar un préstamo existente
  updateLoan: async (id, loanData, documentId) => {
    try {
      const formattedData = {
        data: {}
      };

      // Solo incluir los campos que se quieren actualizar
      if (loanData.bookId !== undefined) formattedData.data.book = loanData.bookId;
      if (loanData.userId !== undefined) formattedData.data.usuario = loanData.userId;
      if (loanData.loanDate !== undefined) formattedData.data.fecha_prestamo = loanData.loanDate;
      if (loanData.dueDate !== undefined) formattedData.data.fecha_devolucion_esperada = loanData.dueDate;
      if (loanData.returnDate !== undefined) formattedData.data.fecha_devolucion_real = loanData.returnDate;
      if (loanData.status !== undefined) formattedData.data.estado = loanData.status;
      if (loanData.notes !== undefined) formattedData.data.notas = loanData.notes;

      // Si tenemos el documentId, usarlo en lugar del id numérico
      const idToUse = documentId || id;

      console.log(`Actualizando préstamo ${documentId ? 'documentId' : 'ID'}: ${idToUse} con datos:`, formattedData);
      const response = await fetchAPI(`/api/loans/${idToUse}`, {
        method: 'PUT',
        body: JSON.stringify(formattedData),
      });
      
      console.log("Respuesta al actualizar préstamo:", response);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar préstamo ${documentId ? 'documentId' : 'ID'} ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un préstamo
  deleteLoan: async (id, documentId) => {
    try {
      // Si tenemos el documentId, usarlo en lugar del id numérico
      const idToUse = documentId || id;
      
      // Primero obtener los datos del préstamo para saber qué libro actualizar
      const loanResponse = await loanService.getLoan(id, documentId);
      if (!loanResponse) {
        throw new Error("No se encontró el préstamo");
      }
      
      console.log(`Eliminando préstamo ${documentId ? 'documentId' : 'ID'}: ${idToUse}`);
      const response = await fetchAPI(`/api/loans/${idToUse}`, {
        method: 'DELETE',
      });
      
      // Si el préstamo tenía estado 'activo', restaurar la unidad al libro
      if (loanResponse.estado === 'activo' && loanResponse.book) {
        const bookId = loanResponse.book.id;
        const bookResponse = await bookService.getBook(bookId);
        
        if (bookResponse.data) {
          const book = bookResponse.data;
          const updatedBook = {
            ...book,
            unidad: book.unidad + 1
          };
          
          console.log("Restaurando unidad al libro después de eliminar préstamo:", updatedBook);
          await bookService.updateBook(book.id, updatedBook);
        }
      }
      
      console.log("Respuesta al eliminar préstamo:", response);
      return response;
    } catch (error) {
      console.error(`Error al eliminar préstamo ${documentId ? 'documentId' : 'ID'} ${id}:`, error);
      throw error;
    }
  },

  // Marcar préstamo como devuelto
  returnLoan: async (loanId, documentId) => {
    console.log(`=== INICIO DE MARCAR PRÉSTAMO COMO DEVUELTO ===`);
    console.log(`ID del préstamo a marcar como devuelto: ${loanId}, documentId: ${documentId}`);
    
    if (!documentId) {
      console.warn("No se proporcionó documentId, intentando obtenerlo");
    }
    
    try {
      // Siempre usar documentId si está disponible
      const idToUse = documentId || loanId;
      console.log(`Obteniendo detalles del préstamo con ID/documentId: ${idToUse}`);
      
      // Usar loanService en lugar de module.exports
      const loanDetails = await loanService.getLoan(loanId, documentId);
      console.log('Detalles del préstamo:', JSON.stringify(loanDetails, null, 2));
      
      if (!loanDetails) {
        console.error('No se encontró el préstamo o no tiene el formato esperado');
        throw new Error('No se pudo encontrar el préstamo');
      }
      
      // Adaptar a diferentes formatos posibles de respuesta
      const loan = loanDetails.attributes ? loanDetails : { attributes: loanDetails };
      
      // Verificar si el préstamo ya está devuelto
      if (loan.attributes.estado === 'devuelto') {
        console.log('El préstamo ya está marcado como devuelto');
        return { data: loan, message: 'El préstamo ya estaba marcado como devuelto' };
      }
      
      // Actualizar el estado del préstamo
      const updateData = {
        data: {
          estado: 'devuelto',
          fecha_devolucion_real: new Date().toISOString().split('T')[0]
        }
      };
      
      console.log(`Actualizando préstamo con datos:`, JSON.stringify(updateData, null, 2));
      
      // Usar siempre documentId para la actualización si está disponible
      const updateResponse = await fetch(`http://localhost:1337/api/loans/${documentId || idToUse}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`Error en la respuesta (${updateResponse.status}):`, errorText);
        throw new Error(`Error al actualizar préstamo: ${updateResponse.status}`);
      }
      
      const updateResult = await updateResponse.json();
      console.log('Respuesta de actualizar préstamo:', JSON.stringify(updateResult, null, 2));
      
      // Si se actualiza correctamente, incrementar el inventario del libro
      if (updateResult && updateResult.data) {
        try {
          // Obtener información del libro
          let book;
          if (loan.attributes.book && loan.attributes.book.data) {
            book = loan.attributes.book.data;
          } else if (loan.attributes.book) {
            book = loan.attributes.book;
          } else if (loan.book && loan.book.data) {
            book = loan.book.data;
          } else if (loan.book) {
            book = loan.book;
          }
          
          if (book) {
            console.log(`Libro encontrado en el préstamo:`, JSON.stringify(book, null, 2));
            
            // Extraer documentId del libro
            let bookDocId;
            if (book.attributes && book.attributes.documentId) {
              bookDocId = book.attributes.documentId;
            } else if (book.documentId) {
              bookDocId = book.documentId;
            } else if (book.id) {
              bookDocId = book.id;
            }
            
            if (!bookDocId) {
              console.error('El libro no tiene documentId, no se puede actualizar el inventario');
              return updateResult;
            }
            
            console.log(`Usando documentId del libro: ${bookDocId}`);
            
            // Obtener datos actuales del libro
            const bookResponse = await fetch(`http://localhost:1337/api/books/${bookDocId}`);
            const bookData = await bookResponse.json();
            
            if (!bookResponse.ok || bookData.error) {
              console.error('Error al obtener datos del libro:', bookData.error || bookResponse.statusText);
              return updateResult;
            }
            
            const bookInfo = bookData.data;
            console.log('Información actual del libro:', JSON.stringify(bookInfo, null, 2));
            
            // Incrementar en 1 las unidades
            let currentUnits = 0;
            if (bookInfo.attributes && bookInfo.attributes.unidad !== undefined) {
              currentUnits = parseInt(bookInfo.attributes.unidad, 10);
            } else if (bookInfo.unidad !== undefined) {
              currentUnits = parseInt(bookInfo.unidad, 10);
            }
            
            const bookUpdateData = {
              data: {
                unidad: currentUnits + 1
              }
            };
            
            console.log('Actualizando inventario con datos:', JSON.stringify(bookUpdateData, null, 2));
            
            // Actualizar el libro usando documentId
            const bookUpdateResponse = await fetch(`http://localhost:1337/api/books/${bookDocId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(bookUpdateData)
            });
            
            if (!bookUpdateResponse.ok) {
              console.error(`Error HTTP al actualizar inventario: ${bookUpdateResponse.status}`);
              return updateResult;
            }
            
            const bookUpdateResult = await bookUpdateResponse.json();
            console.log('Respuesta de actualización de inventario:', JSON.stringify(bookUpdateResult, null, 2));
            
            if (bookUpdateResult.error) {
              console.error('Error al actualizar el inventario:', bookUpdateResult.error);
            } else {
              let nuevasUnidades = 'N/A';
              if (bookUpdateResult.data && bookUpdateResult.data.attributes && bookUpdateResult.data.attributes.unidad !== undefined) {
                nuevasUnidades = bookUpdateResult.data.attributes.unidad;
              } else if (bookUpdateResult.data && bookUpdateResult.data.unidad !== undefined) {
                nuevasUnidades = bookUpdateResult.data.unidad;
              }
              console.log(`Inventario actualizado correctamente. Nuevas unidades: ${nuevasUnidades}`);
            }
          } else {
            console.error('El préstamo no tiene un libro asociado correctamente');
          }
        } catch (inventoryError) {
          console.error('Error al actualizar el inventario:', inventoryError);
          // No revertimos la devolución del préstamo, solo registramos el error
        }
      } else {
        console.error('Error al actualizar el préstamo:', updateResult.error || 'Formato de respuesta inesperado');
        throw new Error(updateResult.error?.message || 'Error al actualizar el préstamo');
      }
      
      console.log('=== FIN DE MARCAR PRÉSTAMO COMO DEVUELTO ===');
      return updateResult;
    } catch (error) {
      console.error('Error al marcar préstamo como devuelto:', error);
      console.log('=== FIN DE MARCAR PRÉSTAMO COMO DEVUELTO (CON ERROR) ===');
      throw error;
    }
  },
  
  // Buscar préstamos por término (en libro o usuario)
  searchLoans: async (searchTerm) => {
    try {
      console.log(`Buscando préstamos con término: ${searchTerm}`);
      // Preparar el término de búsqueda
      const encodedTerm = encodeURIComponent(searchTerm);
      
      // Construir URL con filtros para título, id_libro, autor, username y numcontrol
      const url = `/api/loans?populate=*&filters[$or][0][book][titulo][$containsi]=${encodedTerm}&filters[$or][1][book][id_libro][$containsi]=${encodedTerm}&filters[$or][2][book][autor][$containsi]=${encodedTerm}&filters[$or][3][usuario][username][$containsi]=${encodedTerm}&filters[$or][4][usuario][numcontrol][$containsi]=${encodedTerm}`;
      
      console.log("URL de búsqueda:", url);
      const response = await fetchAPI(url);
      
      console.log("Respuesta de búsqueda de préstamos:", JSON.stringify(response, null, 2));
      
      let loans = [];
      if (response && response.data && Array.isArray(response.data)) {
        loans = response.data;
      } else if (Array.isArray(response)) {
        loans = response;
      }
      
      console.log(`Se encontraron ${loans.length} préstamos`);
      return loans;
    } catch (error) {
      console.error(`Error buscando préstamos con término '${searchTerm}':`, error);
      throw error;
    }
  },

  // Obtener préstamos por libro ID
  getLoansByBook: async (bookId) => {
    try {
      console.log(`Obteniendo préstamos para el libro ID: ${bookId}`);
      
      // Construir URL con filtros para libro y populate para obtener datos relacionados
      const url = `http://localhost:1337/api/loans?populate=*&filters[book][id][$eq]=${bookId}`;
      console.log("URL de búsqueda de préstamos por libro:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Respuesta de préstamos por libro:", JSON.stringify(data, null, 2));
      
      // Procesar la respuesta para asegurar formato consistente
      let loans = [];
      if (data && data.data && Array.isArray(data.data)) {
        loans = data.data;
      } else if (Array.isArray(data)) {
        loans = data;
      }
      
      console.log(`Se encontraron ${loans.length} préstamos para el libro ID ${bookId}`);
      return loans;
    } catch (error) {
      console.error(`Error obteniendo préstamos para libro ID ${bookId}:`, error);
      throw error;
    }
  }
};