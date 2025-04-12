
import { supabase } from '@/integrations/supabase/client';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface QueryOptions {
  search?: string;
  language?: string;
}

// Define allowed table names as a type to fix TypeScript errors
export type TableName = 'countries' | 'cities' | 'spots' | 'routes' | 'events' | 'users';

// Функция получения данных из таблицы с поддержкой пагинации и поиска
export const fetchTableData = async (
  tableName: TableName, 
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
export const fetchRecordById = async (tableName: TableName, id: string) => {
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
export const createRecord = async (tableName: TableName, record: any) => {
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
export const updateRecord = async (tableName: TableName, id: string, record: any) => {
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
export const deleteRecord = async (tableName: TableName, id: string) => {
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
export const getTableColumns = (tableName: TableName, language: string = 'ru') => {
  // Определяем колонки для каждой таблицы
  const columns: Record<TableName, any[]> = {
    countries: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true },
      { key: 'cities_count', label: 'Количество городов' },
      { key: 'code', label: 'Код страны' },
      { key: 'images', label: 'Изображения', isArray: true }
    ],
    cities: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: false },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true },
      { key: 'spots_count', label: 'Количество объектов' },
      { key: 'routes_count', label: 'Количество маршрутов' },
      { key: 'events_count', label: 'Количество событий' },
      { key: 'country', label: 'Страна', foreignKey: 'countries' },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    spots: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true },
      { key: 'city', label: 'Город', foreignKey: 'cities' },
      { key: 'type', label: 'Тип' },
      { key: 'point', label: 'Координаты', isGeometry: true },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    routes: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true },
      { key: 'images', label: 'Изображения', isJsonb: true }
    ],
    events: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название', isJsonb: true, language },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true },
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

// Получение связанных записей для редактирования
export const fetchRelatedRecords = async (tableName: TableName) => {
  try {
    switch (tableName) {
      case 'spots':
        // Для объектов нам нужны маршруты и события
        const routesResponse = await supabase.from('routes').select('id, name').limit(100);
        const eventsResponse = await supabase.from('events').select('id, name').limit(100);
        
        if (routesResponse.error) throw routesResponse.error;
        if (eventsResponse.error) throw eventsResponse.error;
        
        return {
          routes: routesResponse.data || [],
          events: eventsResponse.data || []
        };
        
      case 'routes':
        // Для маршрутов нам нужны объекты и события
        const spotsResponse = await supabase.from('spots').select('id, name').limit(100);
        const routeEventsResponse = await supabase.from('events').select('id, name').limit(100);
        
        if (spotsResponse.error) throw spotsResponse.error;
        if (routeEventsResponse.error) throw routeEventsResponse.error;
        
        return {
          spots: spotsResponse.data || [],
          events: routeEventsResponse.data || []
        };
        
      case 'events':
        // Для событий нам нужны объекты и маршруты
        const eventSpotsResponse = await supabase.from('spots').select('id, name').limit(100);
        const eventRoutesResponse = await supabase.from('routes').select('id, name').limit(100);
        
        if (eventSpotsResponse.error) throw eventSpotsResponse.error;
        if (eventRoutesResponse.error) throw eventRoutesResponse.error;
        
        return {
          spots: eventSpotsResponse.data || [],
          routes: eventRoutesResponse.data || []
        };
        
      default:
        return {};
    }
  } catch (error) {
    console.error(`Error fetching related records for ${tableName}:`, error);
    throw error;
  }
};

// Функция для получения связей для записи
export const fetchRecordRelations = async (tableName: TableName, recordId: string) => {
  try {
    switch (tableName) {
      case 'spots':
        // Получаем связанные маршруты и события для объекта
        const spotRoutesResponse = await supabase
          .from('spot_route')
          .select('route_id')
          .eq('spot_id', recordId);
          
        const spotEventsResponse = await supabase
          .from('spot_event')
          .select('event_id')
          .eq('spot_id', recordId);
          
        if (spotRoutesResponse.error) throw spotRoutesResponse.error;
        if (spotEventsResponse.error) throw spotEventsResponse.error;
        
        return {
          routes: spotRoutesResponse.data.map(item => item.route_id),
          events: spotEventsResponse.data.map(item => item.event_id)
        };
        
      case 'routes':
        // Получаем связанные объекты и события для маршрута
        const routeSpotsResponse = await supabase
          .from('spot_route')
          .select('spot_id')
          .eq('route_id', recordId);
          
        const routeEventsResponse = await supabase
          .from('route_event')
          .select('event_id')
          .eq('route_id', recordId);
          
        if (routeSpotsResponse.error) throw routeSpotsResponse.error;
        if (routeEventsResponse.error) throw routeEventsResponse.error;
        
        return {
          spots: routeSpotsResponse.data.map(item => item.spot_id),
          events: routeEventsResponse.data.map(item => item.event_id)
        };
        
      case 'events':
        // Получаем связанные объекты и маршруты для события
        const eventSpotsResponse = await supabase
          .from('spot_event')
          .select('spot_id')
          .eq('event_id', recordId);
          
        const eventRoutesResponse = await supabase
          .from('route_event')
          .select('route_id')
          .eq('event_id', recordId);
          
        if (eventSpotsResponse.error) throw eventSpotsResponse.error;
        if (eventRoutesResponse.error) throw eventRoutesResponse.error;
        
        return {
          spots: eventSpotsResponse.data.map(item => item.spot_id),
          routes: eventRoutesResponse.data.map(item => item.route_id)
        };
        
      default:
        return {};
    }
  } catch (error) {
    console.error(`Error fetching relations for ${tableName} record:`, error);
    throw error;
  }
};

// Функция для обновления связей записи
export const updateRecordRelations = async (tableName: TableName, recordId: string, relations: any) => {
  try {
    // Начинаем транзакцию
    switch (tableName) {
      case 'spots':
        // Обновляем связи с маршрутами
        if (relations.routes) {
          // Удаляем старые связи
          await supabase
            .from('spot_route')
            .delete()
            .eq('spot_id', recordId);
            
          // Добавляем новые связи
          for (const routeId of relations.routes) {
            await supabase
              .from('spot_route')
              .insert({ spot_id: recordId, route_id: routeId });
          }
        }
        
        // Обновляем связи с событиями
        if (relations.events) {
          // Удаляем старые связи
          await supabase
            .from('spot_event')
            .delete()
            .eq('spot_id', recordId);
            
          // Добавляем новые связи
          for (const eventId of relations.events) {
            await supabase
              .from('spot_event')
              .insert({ spot_id: recordId, event_id: eventId });
          }
        }
        break;
        
      case 'routes':
        // Обновляем связи с объектами
        if (relations.spots) {
          // Удаляем старые связи
          await supabase
            .from('spot_route')
            .delete()
            .eq('route_id', recordId);
            
          // Добавляем новые связи
          for (const spotId of relations.spots) {
            await supabase
              .from('spot_route')
              .insert({ spot_id: spotId, route_id: recordId });
          }
        }
        
        // Обновляем связи с событиями
        if (relations.events) {
          // Удаляем старые связи
          await supabase
            .from('route_event')
            .delete()
            .eq('route_id', recordId);
            
          // Добавляем новые связи
          for (const eventId of relations.events) {
            await supabase
              .from('route_event')
              .insert({ route_id: recordId, event_id: eventId });
          }
        }
        break;
        
      case 'events':
        // Обновляем связи с объектами
        if (relations.spots) {
          // Удаляем старые связи
          await supabase
            .from('spot_event')
            .delete()
            .eq('event_id', recordId);
            
          // Добавляем новые связи
          for (const spotId of relations.spots) {
            await supabase
              .from('spot_event')
              .insert({ spot_id: spotId, event_id: recordId });
          }
        }
        
        // Обновляем связи с маршрутами
        if (relations.routes) {
          // Удаляем старые связи
          await supabase
            .from('route_event')
            .delete()
            .eq('event_id', recordId);
            
          // Добавляем новые связи
          for (const routeId of relations.routes) {
            await supabase
              .from('route_event')
              .insert({ route_id: routeId, event_id: recordId });
          }
        }
        break;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating relations for ${tableName} record:`, error);
    throw error;
  }
};
