export interface User {
  id: string;
  documentId?: string;
  username: string;
  email: string;
  role: string;
  name: string;
  numcontrol?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  documentId?: string;
  titulo: string;
  autor: string;
  clasificacion: string;
  descripcion?: string;
  portada?: string;
  estado?: string;
  unidad: number;
  publishYear?: number;
  publisher?: string;
  genre?: string;
  location?: string;
  copies?: number;
  availableCopies?: number;
  isbn?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  documentId?: string;
  userId: string;
  userName: string;
  userNumControl?: string;
  bookId: string;
  bookTitle: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  notes?: string;
}

export interface LibraryEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  visitorName: string | null;
  visitorType: 'member' | 'guest';
  entryTime: string;
  exitTime: string | null;
  purpose: string | null;
}

export interface Report {
  id: string;
  title: string;
  type: 'loans' | 'returns' | 'users' | 'books' | 'entries' | 'custom';
  dateRange: {
    from: string;
    to: string;
  };
  generatedBy: string;
  generatedAt: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'completed' | 'processing' | 'failed';
  url: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}