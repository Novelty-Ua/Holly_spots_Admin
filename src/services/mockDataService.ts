
// This service provides mock data for development purposes
// It will be replaced with Supabase integration later

interface MockData {
  [key: string]: any[];
}

// Generate mock multilingual content
const generateMultilingualContent = (enText: string, index: number) => ({
  en: `${enText} ${index}`,
  hi: `${enText} ${index} हिन्दी वर्जन`,
  ru: `${enText} ${index} русская версия`
});

// Mock data for all tables
export const mockData: MockData = {
  countries: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: generateMultilingualContent('Country', i + 1),
    code: `C${i + 1}`,
    created_at: new Date(2023, 0, i + 1).toISOString(),
    updated_at: new Date(2023, 6, i + 1).toISOString(),
  })),
  
  cities: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: generateMultilingualContent('City', i + 1),
    country_id: (i % 15) + 1,
    description: generateMultilingualContent('Description for city', i + 1),
    created_at: new Date(2023, 1, i + 1).toISOString(),
    updated_at: new Date(2023, 7, i + 1).toISOString(),
  })),
  
  spots: Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: generateMultilingualContent('Holy Spot', i + 1),
    description: generateMultilingualContent('Description for holy spot', i + 1),
    city_id: (i % 20) + 1,
    location: "0101000020E6100000D188E30AB93D51400B4B9759DF413640", // Mock geometry
    photos: Array.from(
      { length: Math.floor(Math.random() * 5) + 1 }, 
      (_, j) => `https://rxvckkqqunyqtxjyabub.supabase.co/storage/v1/object/public/holyspots//image${i}_${j}.jpg`
    ),
    created_at: new Date(2023, 2, i + 1).toISOString(),
    updated_at: new Date(2023, 8, i + 1).toISOString(),
  })),
  
  routes: Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: generateMultilingualContent('Route', i + 1),
    description: generateMultilingualContent('Description for route', i + 1),
    city_id: (i % 20) + 1,
    duration: Math.floor(Math.random() * 5) + 1,
    distance: Math.floor(Math.random() * 10) + 1,
    created_at: new Date(2023, 3, i + 1).toISOString(),
    updated_at: new Date(2023, 9, i + 1).toISOString(),
  })),
  
  events: Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name: generateMultilingualContent('Event', i + 1),
    description: generateMultilingualContent('Description for event', i + 1),
    start_date: new Date(2023, i % 12, Math.floor(Math.random() * 28) + 1).toISOString(),
    end_date: new Date(2023, (i % 12) + 1, Math.floor(Math.random() * 28) + 1).toISOString(),
    created_at: new Date(2023, 4, i + 1).toISOString(),
    updated_at: new Date(2023, 10, i + 1).toISOString(),
  })),
  
  users: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
    role: i < 2 ? 'admin' : 'user',
    created_at: new Date(2023, 5, i + 1).toISOString(),
    last_login: new Date(2023, 11, i + 1).toISOString(),
  })),
};

// Table column definitions
export const tableColumns: { [key: string]: { key: string; label: string }[] } = {
  countries: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'code', label: 'Код' },
    { key: 'created_at', label: 'Создано' },
  ],
  
  cities: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'country_id', label: 'ID страны' },
    { key: 'description', label: 'Описание' },
    { key: 'created_at', label: 'Создано' },
  ],
  
  spots: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'city_id', label: 'ID города' },
    { key: 'description', label: 'Описание' },
    { key: 'photos', label: 'Фотографии' },
    { key: 'created_at', label: 'Создано' },
  ],
  
  routes: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'city_id', label: 'ID города' },
    { key: 'duration', label: 'Длительность (ч)' },
    { key: 'distance', label: 'Расстояние (км)' },
    { key: 'created_at', label: 'Создано' },
  ],
  
  events: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'start_date', label: 'Дата начала' },
    { key: 'end_date', label: 'Дата окончания' },
    { key: 'created_at', label: 'Создано' },
  ],
  
  users: [
    { key: 'id', label: 'ID' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Имя' },
    { key: 'role', label: 'Роль' },
    { key: 'created_at', label: 'Создано' },
    { key: 'last_login', label: 'Последний вход' },
  ],
};

// Mock pagination functionality
export const getPaginatedData = (
  table: string,
  page: number = 1,
  pageSize: number = 10,
  searchQuery: string = '',
  language: string = 'ru'
) => {
  let filteredData = [...mockData[table]];
  
  // Apply language filter to multilingual fields
  filteredData = filteredData.map(item => {
    const result = { ...item };
    
    // Process name field if it's multilingual
    if (result.name && typeof result.name === 'object') {
      // Save the multilingual object to show in detailed view
      result._fullName = result.name;
      // Display only the selected language
      result.name = result.name[language] || result.name.en || JSON.stringify(result.name);
    }
    
    // Process description field if it's multilingual
    if (result.description && typeof result.description === 'object') {
      // Save the multilingual object to show in detailed view
      result._fullDescription = result.description;
      // Display only the selected language
      result.description = result.description[language] || result.description.en || JSON.stringify(result.description);
    }
    
    return result;
  });
  
  // Apply search filtering
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }
  
  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  };
};

// Mock function for deleting a record
export const deleteRecord = (table: string, id: number) => {
  const index = mockData[table].findIndex(record => record.id === id);
  if (index !== -1) {
    mockData[table].splice(index, 1);
    return true;
  }
  return false;
};

// Mock function for updating a record
export const updateRecord = (table: string, id: number, data: any) => {
  const index = mockData[table].findIndex(record => record.id === id);
  if (index !== -1) {
    mockData[table][index] = {
      ...mockData[table][index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return mockData[table][index];
  }
  return null;
};

// Mock function for creating a record
export const createRecord = (table: string, data: any) => {
  const newId = Math.max(...mockData[table].map(record => record.id)) + 1;
  const newRecord = {
    id: newId,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockData[table].push(newRecord);
  return newRecord;
};
