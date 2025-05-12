/**
 * Servicio para obtener portadas de libros desde Google Books API
 */

import { API_BASE_URL } from '../lib/config';

// URL base para la API de Google Books (no requiere API key para búsquedas básicas)
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

// Imagen por defecto para cuando no se encuentra una portada
const DEFAULT_COVER = "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg";

/**
 * Busca la portada de un libro usando su título y autor
 * @param title El título del libro
 * @param author El autor del libro
 * @returns URL de la portada o imagen por defecto
 */
export async function fetchBookCover(title: string, author: string): Promise<string> {
  try {
    // Crear consulta combinando título y autor
    const query = encodeURIComponent(`${title} ${author}`);
    
    // Hacer solicitud a Google Books API
    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${query}&maxResults=1`);
    
    // Si la respuesta no es exitosa, devolver imagen por defecto
    if (!response.ok) {
      console.error(`Error al buscar portada para ${title}: ${response.statusText}`);
      return DEFAULT_COVER;
    }
    
    // Procesar la respuesta JSON
    const data = await response.json();
    
    // Verificar si hay resultados y tienen imágenes
    if (data.items && data.items.length > 0 && 
        data.items[0].volumeInfo && 
        data.items[0].volumeInfo.imageLinks) {
      
      // Usar la imagen de tamaño mediano o la miniatura
      const imageUrl = data.items[0].volumeInfo.imageLinks.thumbnail || 
                       data.items[0].volumeInfo.imageLinks.smallThumbnail;
      
      // Reemplazar http por https para evitar problemas de contenido mixto
      return imageUrl.replace('http://', 'https://');
    }
    
    // Si no hay resultados o no tienen imágenes, devolver imagen por defecto
    return DEFAULT_COVER;
  } catch (error) {
    console.error(`Error al buscar portada para "${title}":`, error);
    return DEFAULT_COVER;
  }
}

/**
 * Caché para almacenar portadas ya buscadas y evitar múltiples llamadas a la API
 */
const coverCache: Record<string, string> = {};

/**
 * Busca la portada de un libro con caché para evitar búsquedas repetidas
 * @param title El título del libro
 * @param author El autor del libro
 * @returns URL de la portada o imagen por defecto
 */
export async function getCachedBookCover(title: string, author: string): Promise<string> {
  // Crear una clave única para este libro
  const cacheKey = `${title}-${author}`.toLowerCase();
  
  // Si ya tenemos esta portada en caché, devolverla inmediatamente
  if (coverCache[cacheKey]) {
    return coverCache[cacheKey];
  }
  
  // Buscar la portada
  const coverUrl = await fetchBookCover(title, author);
  
  // Guardar en caché para futuras consultas
  coverCache[cacheKey] = coverUrl;
  
  return coverUrl;
}

export const bookCoverService = {
  getCoverUrl: (bookId: string) => `${API_BASE_URL}/api/books/${bookId}/cover`,
};

export default {
  fetchBookCover,
  getCachedBookCover
};