
import { supabase } from '@/integrations/supabase/client';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface QueryOptions {
  search?: string;
  language?: string;
}

// Функция получения данных из таблицы с поддержкой пагинации и поиска
export const fetchTableData = async (
  tableName: string, 
  { page, pageSize }: PaginationOptions,
  { search, language = 'ru' }: QueryOptions = {}
) => {
  try {
    // Рассчитываем значения для пагинации
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(from, to);
    
    // Добавляем поиск, если он есть
    if (search && search.trim() !== '') {
      // Для разных таблиц разный поиск
      switch (tableName) {
        case 'countries':
        case 'cities':
        case 'spots':
        case 'routes':
        case 'events':
          // Поиск по имени в JSON поле name для конкретного языка
          query = query.filter(`name->>${language}`, 'ilike', `%${search}%`);
          break;
        case 'users':
          // Поиск по имени пользователя
          query = query.filter('name', 'ilike', `%${search}%`);
          break;
      }
    }
    
    const { data, count, error } = await query;
    
    if (error) throw error;
    
    return {
      data: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }
};

// Получение одной записи по ID
export const fetchRecordById = async (tableName: string, id: string) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${tableName} record:`, error);
    throw error;
  }
};

// Создание новой записи
export const createRecord = async (tableName: string, record: any) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert(record)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error(`Error creating ${tableName} record:`, error);
    throw error;
  }
};

// Обновление записи
export const updateRecord = async (tableName: string, id: string, record: any) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .update(record)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error(`Error updating ${tableName} record:`, error);
    throw error;
  }
};

// Удаление записи
export const deleteRecord = async (tableName: string, id: string) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting ${tableName} record:`, error);
    throw error;
  }
};

// Получение колонок для таблицы
export const getTableColumns = (tableName: string, language: string = 'ru') => {
  // Определяем колонки для каждой таблицы
  const columns: Record<string, any[]> = {
    countries: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language },
      { key: 'cities_count', label: 'Количество городов' },
      { key: 'code', label: 'Код страны' },
      { key: 'images', label: 'Изображения', isArray: true }
    ],
    cities: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название' },
      { key: 'info', label: 'Информация', isJsonb: true, language },
      { key: 'spots_count', label: 'Количество объектов' },
      { key: 'routes_count', label: 'Количество маршрутов' },
      { key: 'events_count', label: 'Количество событий' },
      { key: 'country', label: 'Страна', foreignKey: 'countries' },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    spots: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language },
      { key: 'city', label: 'Город', foreignKey: 'cities' },
      { key: 'type', label: 'Тип' },
      { key: 'point', label: 'Координаты', isGeometry: true },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    routes: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    events: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language },
      { key: 'type', label: 'Тип' },
      { key: 'time', label: 'Время' },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    users: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Имя' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Телефон' },
      { key: 'language', label: 'Язык' },
      { key: 'role', label: 'Роль' },
      { key: 'tarif', label: 'Тариф' },
      { key: 'points', label: 'Очки' },
      { key: 'created_at', label: 'Дата создания' }
    ]
  };
  
  return columns[tableName] || [];
};
