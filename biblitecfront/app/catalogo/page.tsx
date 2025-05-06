"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookMarked, Filter, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { bookService } from '@/services/bookService';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import EditBookModal from './components/EditBookModal';
import BookDetailModal from './components/BookDetailModal';
import AddBookModal from './components/AddBookModal';
import { BookCard } from './components/BookCard';

// Definir tipo para libro
export interface Book {
  id_libro: string | number;
  unidad: number;
  titulo: string;
  autor: string;
  clasificacion: string;
  
  // Campos opcionales para mantener compatibilidad
  id?: string | number;
  documentId?: string;
  title?: string;
  author?: string;
  description?: string;
  coverImage?: string;
  publishYear?: number;
  genre?: string;
  location?: string;
  copies?: number;
  avaliableCopies?: number;
  ISBN?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export default function CatalogoPage() {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  // State for books data
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Para carga parcial
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(18);
  const [totalBooks, setTotalBooks] = useState(0);
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  
  // State for detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | number | null>(null);
  
  // State for add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  
  // Implementar debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  useEffect(() => {
    // Ejecutar fetchBooks solo una vez durante la carga inicial y cuando cambien los filtros
    fetchBooks(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, filterCategory]);
  
  const fetchBooks = async (page = 1) => {
    // Permitir siempre la primera carga, pero evitar múltiples peticiones simultáneas en búsquedas
    if (isLoading && !isFirstLoad) return;
    
    // Si ya tenemos libros cargados, mostrar indicador de actualización en lugar de pantalla completa de carga
    if (books.length > 0) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    try {
      // Construir filtros para búsqueda y categoría
      const filters: any = {
        'pagination[page]': page,
        'pagination[pageSize]': booksPerPage,
      };
      if (debouncedSearchTerm) filters['filters[$or][0][titulo][$containsi]'] = debouncedSearchTerm;
      if (debouncedSearchTerm) filters['filters[$or][1][autor][$containsi]'] = debouncedSearchTerm;
      if (debouncedSearchTerm) filters['filters[$or][2][clasificacion][$containsi]'] = debouncedSearchTerm;
      if (debouncedSearchTerm) filters['filters[$or][3][id_libro][$containsi]'] = debouncedSearchTerm;
      if (filterCategory) filters['filters[clasificacion][$eq]'] = filterCategory;

      const response = await bookService.getBooks(filters);
      if (response && response.data) {
        const processedBooks = response.data.map((book: any) => ({
          id: book.id,
          documentId: book.documentId,
          id_libro: book.id_libro || book.id?.toString() || '',
          titulo: book.titulo || book.title || '',
          autor: book.autor || book.author || '',
          clasificacion: book.clasificacion || book.genre || '',
          unidad: book.unidad || (book.location ? parseInt(book.location) : 0),
          coverImage: book.coverImage || '',
        }));
        setBooks(processedBooks);
        setFilteredBooks(processedBooks);
        setTotalBooks(response.meta?.pagination?.total || processedBooks.length);
      } else {
        setError('No se pudo obtener la información de los libros');
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      setError('Ha ocurrido un error al cargar los libros. Inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFirstLoad(false); // Marcar que ya no es la primera carga
    }
  };
  
  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is handled in the useEffect
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilteredBooks(books);
  };
  
  const handleDeleteBook = async (bookId: string | number) => {
    try {
      // Intentar eliminar usando el ID proporcionado (que debería ser documentId)
      await bookService.deleteBook(bookId);
      
      // Eliminar el libro de las listas usando cualquier ID disponible
      const updatedBooks = books.filter(book => (
        book.documentId !== bookId && // documentId es la prioridad
        book.id_libro !== bookId && 
        book.id !== bookId
      ));
      setBooks(updatedBooks);
      setFilteredBooks(prevFiltered => 
        prevFiltered.filter(book => (
          book.documentId !== bookId && 
          book.id_libro !== bookId && 
          book.id !== bookId
        ))
      );
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting book:", error);
      return Promise.reject(error);
    }
  };
  
  const handleEditBook = (book: Book) => {
    setCurrentBook(book);
    setIsEditModalOpen(true);
  };
  
  const handleBookUpdated = () => {
    fetchBooks(currentPage); // Refresh the book list
  };
  
  const handleViewBookDetails = (bookId: string | number) => {
    setSelectedBookId(bookId);
    setIsDetailModalOpen(true);
  };
  
  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(totalBooks / booksPerPage));
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(books.map(book => book.clasificacion || book.genre || ''))).filter(Boolean);
  
  // Verificar si el usuario tiene permisos para agregar libros
  const canAddBooks = user && !['alumno', 'authenticated'].includes(user.role);
  
  if (isLoading && books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Cargando catálogo...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Error al cargar el catálogo</h3>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <Button onClick={() => fetchBooks(currentPage)}>Reintentar</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de la Biblioteca</h1>
          <p className="text-muted-foreground mt-2">Explora nuestra colección de libros</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-end mb-8">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          {isRefreshing ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4">
              <div className="w-4 h-4 border-t-2 border-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            type="search"
            placeholder="Buscar por título, autor, clasificación o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          {canAddBooks && (
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Agregar libro
            </Button>
          )}
        </div>
      </div>
      
      {isFilterVisible && (
        <div className="bg-muted/50 p-4 rounded-lg mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Input
                type="search"
                placeholder="Buscar por título, autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" type="button" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </form>
        </div>
      )}
      
      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-6 sm:p-12 text-center">
          <BookMarked className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No se encontraron libros</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            No hay libros que coincidan con los criterios de búsqueda. Prueba ajustando los filtros.
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
            {books.map((book) => (
              <BookCard 
                key={book.id_libro || book.id} 
                book={book} 
                onDelete={handleDeleteBook}
                onEdit={handleEditBook}
                onViewDetails={handleViewBookDetails}
              />
            ))}
          </div>
          
          <Pagination className="my-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                
                // Show first page, last page, current page, and one page before and after current
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => paginate(pageNumber)}
                        isActive={pageNumber === currentPage}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Add ellipsis if there's a gap
                if (
                  (pageNumber === 2 && currentPage > 3) ||
                  (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}
      
      {/* Edit Modal */}
      <EditBookModal 
        book={currentBook}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onBookUpdated={handleBookUpdated}
      />
      
      {/* Detail Modal */}
      <BookDetailModal
        bookId={selectedBookId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onEdit={handleEditBook}
        onDelete={handleDeleteBook}
      />
      
      {/* Add Modal */}
      <AddBookModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onBookAdded={handleBookUpdated}
      />
    </div>
  );
}