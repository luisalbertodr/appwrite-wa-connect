import { Cliente } from '@/types';

/**
 * Genera el campo unificado de búsqueda concatenando todos los campos relevantes
 */
export const generateSearchUnified = (cliente: Partial<Cliente>): string => {
  const fields = [
    cliente.nombre_completo || '',
    cliente.dnicli || '',
    cliente.tel1cli || '',
    cliente.tel2cli || '',
    cliente.email || '',
  ];
  
  return fields
    .filter(f => f.trim() !== '')
    .join(' ')
    .toLowerCase()
    .trim();
};

/**
 * Filtra resultados para que contengan TODAS las palabras (búsqueda AND)
 */
export const filterByAllWords = <T extends { search_unified?: string }>(
  items: T[],
  searchQuery: string
): T[] => {
  if (!searchQuery || searchQuery.trim() === '') return items;
  
  const words = searchQuery.toLowerCase().trim().split(/\s+/);
  
  return items.filter(item => {
    const searchText = (item.search_unified || '').toLowerCase();
    // Verificar que TODAS las palabras estén presentes
    return words.every(word => searchText.includes(word));
  });
};
