
import { supabase } from '@/integrations/supabase/client';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js'; // Import the type

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Add filters and sorting to QueryOptions
export interface QueryOptions {
  search?: string;
  language?: string;
  filters?: Record<string, string>;
  sortKey?: string; // Added sort key
  sortAscending?: boolean; // Added sort direction
}

// Define allowed table names as a type to fix TypeScript errors
export type TableName = 'countries' | 'cities' | 'spots' | 'routes' | 'events' | 'users' | 'profiles' | 'stories';

// Helper function to get column info (assuming getTableColumns is reliable)
// Duplicated here for self-containment, ensure consistency or import
export const getTableColumns = (tableName: TableName, language: string = 'ru'): any[] => {
   // Определяем колонки для каждой таблицы
   const columns: Record<TableName, any[]> = {
    countries: [
      { key: 'id', label: 'ID', sortable: true, },
      { key: 'name', label: 'Название', isJsonb: true, language, sortable: true, },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true, sortable: false, }, // Info likely not sortable
      { key: 'cities_count', label: 'Количество городов', isNumeric: true, sortable: true, },
      { key: 'code', label: 'Код страны', sortable: true, },
      { key: 'images', label: 'Изображения', isArray: true, sortable: false, }, // Images likely not sortable
    ],
    cities: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Название', isJsonb: true, language, sortable: true }, // Пометили как мультиязычное
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true, sortable: false },
      { key: 'spots_count', label: 'Количество объектов', isNumeric: true, sortable: true }, 
      { key: 'routes_count', label: 'Количество маршрутов', isNumeric: true, sortable: true }, 
      { key: 'events_count', label: 'Количество событий', isNumeric: true, sortable: true }, 
      { key: 'country', label: 'Страна', foreignKey: 'countries', sortable: true }, // Sorting by FK might require joins or specific logic
      { key: 'images', label: 'Изображения', isJsonb: true, sortable: false } 
    ],
    spots: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Название', isJsonb: true, language, sortable: true },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true, sortable: false },
      { key: 'city', label: 'Город', foreignKey: 'cities', sortable: true }, 
      { key: 'type', label: 'Тип', sortable: true },
      { key: 'point', label: 'Координаты', isGeometry: true, sortable: false }, // Geometry not sortable
      { key: 'images', label: 'Изображения', isJsonb: true, sortable: false } 
    ],
    routes: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Название', isJsonb: true, language, sortable: true },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true, sortable: false },
      { key: 'images', label: 'Изображения', isJsonb: true, sortable: false } 
    ],
    events: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Название', isJsonb: true, language, sortable: true },
      { key: 'info', label: 'Информация', isJsonb: true, language, truncate: true, sortable: false },
      { key: 'type', label: 'Тип', sortable: true },
      { key: 'time', label: 'Время', sortable: true }, // Assuming time is sortable
      { key: 'images', label: 'Изображения', isJsonb: true, sortable: false } 
    ],
    users: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Имя', sortable: true }, 
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Телефон', sortable: false }, // Phone might not be ideal for sorting
      { key: 'language', label: 'Язык', sortable: true },
      { key: 'role', label: 'Роль', sortable: true },
      { key: 'tarif', label: 'Тариф', sortable: true },
      { key: 'points', label: 'Очки', isNumeric: true, sortable: true }, 
      { key: 'created_at', label: 'Дата создания', sortable: true } // Assuming timestamp/date is sortable
    ],
    profiles: [ // Placeholder columns
      { key: 'id', label: 'ID', sortable: true },
      { key: 'full_name', label: 'Полное имя', sortable: true },
      { key: 'avatar_url', label: 'Аватар', sortable: false },
      { key: 'updated_at', label: 'Обновлено', sortable: true },
    ],
    stories: [ // Placeholder columns
      { key: 'id', label: 'ID', sortable: true },
      { key: 'title', label: 'Заголовок', sortable: true }, // Assuming a title field
      // Add other relevant story columns here later
    ]
   };

   // Optionally add common sortable columns like created_at if not explicitly defined
   // const commonSortable = ['created_at', 'updated_at'];
   // if (columns[tableName]) {
   //   commonSortable.forEach(key => {
   //     if (!columns[tableName].find(c => c.key === key)) {
   //       columns[tableName].push({ key, label: key.replace('_', ' ').toUpperCase(), sortable: true });
   //     }
   //   });
   // }
   
   return columns[tableName] || [];
};


// Функция получения данных из таблицы с поддержкой пагинации, поиска, фильтрации и сортировки
export const fetchTableData = async (
  tableName: TableName,
  { page, pageSize }: PaginationOptions,
  { search, language = 'ru', filters = {}, sortKey, sortAscending = true }: QueryOptions = {} // Destructure sort options
) => {
  try {
    // Рассчитываем значения для пагинации
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const tableColumns = getTableColumns(tableName, language); // Get column definitions early

    // Explicitly type the query variable
    let query: PostgrestFilterBuilder<any, any, Record<string, any>[], unknown>;
    
    // Construct the select string based on the table name
    let selectString = '*';
    if (tableName === 'cities') {
      // Fetch the whole 'name' JSONB object from the related 'countries' table
      selectString = `*, countries(id, name)`; // Request id and the name object
    }
    // Note: We removed the nested select for 'spots' here.
    // We will fetch related city names in a separate step below.

    query = supabase
      .from(tableName)
      .select(selectString, { count: 'exact' }) // selectString is '*' for spots now
      .range(from, to);

    // Добавляем поиск (OR across searchable fields)
    if (search && search.trim() !== '') {
      const searchableColumns = tableColumns.filter(col => 
         col.key === 'name' || col.key === 'email' || col.key === 'code' || col.key === 'type' 
      );
      const searchConditions = searchableColumns.map(col => {
        if (col.isJsonb && col.language) {
          return `${col.key}->>${col.language}.ilike.%${search}%`;
        } else if (!col.isNumeric && !col.isJsonb && !col.foreignKey && !col.isArray && !col.isGeometry) {
          return `${col.key}.ilike.%${search}%`;
        }
        return null;
      }).filter(condition => condition !== null).join(',');

      if (searchConditions) {
         query = query.or(searchConditions);
      }
    }

    // Добавляем фильтры
    for (const columnKey in filters) {
      const filterValue = filters[columnKey];
      if (filterValue && filterValue.trim() !== '') {
        const columnInfo = tableColumns.find(col => col.key === columnKey);
        if (columnInfo) {
           if (columnInfo.isNumeric) {
             const numericValue = parseFloat(filterValue);
             if (!isNaN(numericValue)) {
               query = query.eq(columnKey, numericValue);
             } else {
               console.warn(`Invalid numeric filter value '${filterValue}' for column '${columnKey}'. Filter ignored.`);
             }
           } else if (columnInfo.isJsonb && columnInfo.language) {
             query = query.ilike(`${columnKey}->>${columnInfo.language}`, `%${filterValue}%`);
           } else if (columnInfo.foreignKey) {
             console.warn(`Applying ilike filter to foreign key column '${columnKey}'.`);
             query = query.ilike(columnKey, `%${filterValue}%`); 
           } else if (!columnInfo.isArray && !columnInfo.isGeometry) { 
             query = query.ilike(columnKey, `%${filterValue}%`);
           } else {
             console.warn(`Filtering not supported for column '${columnKey}' of its type.`);
           }
        }
      }
    }
    
    // Добавляем сортировку
    if (sortKey) {
      const columnInfo = tableColumns.find(col => col.key === sortKey);
      if (columnInfo && columnInfo.sortable) { // Check if column is sortable
         if (columnInfo.isJsonb && columnInfo.language && sortKey) {
            // Correct syntax for ordering by a specific key within a JSONB column
            // Use the '->>' operator to extract the text value for the given language
            query = query.order(`${sortKey}->>${language}`, { ascending: sortAscending, nullsFirst: true }); // nullsFirst: true (or false) is often useful
         } else if (sortKey) { // Ensure sortKey is not null/undefined for standard sort
             // Standard sort for non-JSONB fields
             query = query.order(sortKey, { ascending: sortAscending, nullsFirst: true });
         }
      } else if (columnInfo && !columnInfo.sortable) {
          console.warn(`Column '${sortKey}' is marked as not sortable. Ignoring sort.`);
      } else {
          console.warn(`Sort key '${sortKey}' not found or invalid. Ignoring sort.`);
      }
    } else {
       // Default sort if no sortKey provided (e.g., by ID or creation date)
       const defaultSortColumn = tableColumns.find(c => c.key === 'created_at') || tableColumns.find(c => c.key === 'id');
       if (defaultSortColumn && defaultSortColumn.sortable !== false) { // Check if default is sortable
           query = query.order(defaultSortColumn.key, { ascending: false }); // Default descending by date or ID
       }
    }

    let { data, count, error } = await query;

    if (error) {
      console.error(`Supabase query error fetching main data for ${tableName}:`, JSON.stringify(error, null, 2));
      throw error;
    }

    let processedData = data || [];

    // --- Post-processing for related names ---
    if (tableName === 'spots' && processedData.length > 0) {
      // 1. Get unique city IDs from the spots data
      const cityIds = [...new Set(processedData.map(spot => spot.city).filter(id => id != null))];

      if (cityIds.length > 0) {
        // 2. Fetch corresponding city names
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('id, name') // Select id and the name JSONB object
          .in('id', cityIds);

        if (citiesError) {
          console.error(`Supabase query error fetching related cities for spots:`, JSON.stringify(citiesError, null, 2));
          // Proceed without city names if this fails, maybe log it
        } else if (citiesData) {
          // 3. Create a map for quick lookup: cityId -> cityName
          const cityNamesMap = citiesData.reduce((acc, city) => {
            if (city.name && typeof city.name === 'object' && city.name[language]) {
              acc[city.id] = city.name[language]; // Extract name for the current language
            } else {
               acc[city.id] = city.id; // Fallback to ID if name is missing/invalid
            }
            return acc;
          }, {} as Record<string, string>);

          // 4. Add cityName to each spot object
          processedData = processedData.map(spot => ({
            ...spot,
            // Use the map to get the name, fallback to the original city ID if not found
            cityName: cityNamesMap[spot.city] || spot.city
          }));
        }
      }
    }
    // Add similar post-processing for 'cities' to fetch country names if needed,
    // although the nested select seemed to work there. Keeping it simple for now.
    // --- End of Post-processing ---

    return {
      data: processedData, // Return the processed data with added names
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error; // Re-throw the error to be caught by the calling component
  }
};

// --- Rest of the functions remain the same --- 
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


// Получение связанных записей для редактирования
export const fetchRelatedRecords = async (tableName: TableName) => {
  try {
    const selectName = async (relationTable: TableName, lang: string = 'ru') => {
        const cols = getTableColumns(relationTable, lang);
        const nameCol = cols.find(c => c.key === 'name');
        if (nameCol && nameCol.isJsonb) {
            return `id, name->>'${lang}' as name`;
        }
        return 'id, name';
    };

    switch (tableName) {
      case 'spots':
        const routesResponse = await supabase.from('routes').select(await selectName('routes')).limit(100);
        const eventsResponse = await supabase.from('events').select(await selectName('events')).limit(100);
        if (routesResponse.error) throw routesResponse.error;
        if (eventsResponse.error) throw eventsResponse.error;
        return { routes: routesResponse.data || [], events: eventsResponse.data || [] };

      case 'routes':
        const spotsResponse = await supabase.from('spots').select(await selectName('spots')).limit(100);
        const routeEventsResponse = await supabase.from('events').select(await selectName('events')).limit(100);
        if (spotsResponse.error) throw spotsResponse.error;
        if (routeEventsResponse.error) throw routeEventsResponse.error;
        return { spots: spotsResponse.data || [], events: routeEventsResponse.data || [] };

      case 'events':
        const eventSpotsResponse = await supabase.from('spots').select(await selectName('spots')).limit(100);
        const eventRoutesResponse = await supabase.from('routes').select(await selectName('routes')).limit(100);
        if (eventSpotsResponse.error) throw eventSpotsResponse.error;
        if (eventRoutesResponse.error) throw eventRoutesResponse.error;
        return { spots: eventSpotsResponse.data || [], routes: eventRoutesResponse.data || [] };

      default: return {};
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
        const spotRoutesResponse = await supabase.from('spot_route').select('route_id').eq('spot_id', recordId);
        const spotEventsResponse = await supabase.from('spot_event').select('event_id').eq('spot_id', recordId);
        if (spotRoutesResponse.error) throw spotRoutesResponse.error;
        if (spotEventsResponse.error) throw spotEventsResponse.error;
        return { routes: spotRoutesResponse.data.map(item => item.route_id), events: spotEventsResponse.data.map(item => item.event_id) };

      case 'routes':
        const routeSpotsResponse = await supabase.from('spot_route').select('spot_id').eq('route_id', recordId);
        const routeEventsResponse = await supabase.from('route_event').select('event_id').eq('route_id', recordId);
        if (routeSpotsResponse.error) throw routeSpotsResponse.error;
        if (routeEventsResponse.error) throw routeEventsResponse.error;
        return { spots: routeSpotsResponse.data.map(item => item.spot_id), events: routeEventsResponse.data.map(item => item.event_id) };

      case 'events':
        const eventSpotsResponse = await supabase.from('spot_event').select('spot_id').eq('event_id', recordId);
        const eventRoutesResponse = await supabase.from('route_event').select('route_id').eq('event_id', recordId);
        if (eventSpotsResponse.error) throw eventSpotsResponse.error;
        if (eventRoutesResponse.error) throw eventRoutesResponse.error;
        return { spots: eventSpotsResponse.data.map(item => item.spot_id), routes: eventRoutesResponse.data.map(item => item.route_id) };

      default: return {};
    }
  } catch (error) {
    console.error(`Error fetching relations for ${tableName} record:`, error);
    throw error;
  }
};

// Функция для обновления связей записи
export const updateRecordRelations = async (tableName: TableName, recordId: string, relations: any) => {
  try {
    switch (tableName) {
      case 'spots':
        if (relations.routes !== undefined) { 
          await supabase.from('spot_route').delete().eq('spot_id', recordId);
          if (relations.routes.length > 0) {
            const routeInserts = relations.routes.map((routeId: string) => ({ spot_id: recordId, route_id: routeId }));
            await supabase.from('spot_route').insert(routeInserts);
          }
        }
        if (relations.events !== undefined) { 
          await supabase.from('spot_event').delete().eq('spot_id', recordId);
          if (relations.events.length > 0) {
             const eventInserts = relations.events.map((eventId: string) => ({ spot_id: recordId, event_id: eventId }));
             await supabase.from('spot_event').insert(eventInserts);
          }
        }
        break;

      case 'routes':
        if (relations.spots !== undefined) {
          await supabase.from('spot_route').delete().eq('route_id', recordId);
          if (relations.spots.length > 0) {
            const spotInserts = relations.spots.map((spotId: string) => ({ spot_id: spotId, route_id: recordId }));
            await supabase.from('spot_route').insert(spotInserts);
          }
        }
        if (relations.events !== undefined) {
          await supabase.from('route_event').delete().eq('route_id', recordId);
           if (relations.events.length > 0) {
            const eventInserts = relations.events.map((eventId: string) => ({ route_id: recordId, event_id: eventId }));
            await supabase.from('route_event').insert(eventInserts);
           }
        }
        break;

      case 'events':
        if (relations.spots !== undefined) {
          await supabase.from('spot_event').delete().eq('event_id', recordId);
          if (relations.spots.length > 0) {
            const spotInserts = relations.spots.map((spotId: string) => ({ spot_id: spotId, event_id: recordId }));
            await supabase.from('spot_event').insert(spotInserts);
          }
        }
        if (relations.routes !== undefined) {
          await supabase.from('route_event').delete().eq('event_id', recordId);
          if (relations.routes.length > 0) {
             const routeInserts = relations.routes.map((routeId: string) => ({ route_id: routeId, event_id: recordId }));
             await supabase.from('route_event').insert(routeInserts);
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
