
const makeApiRequest = async (endpoint, params = {}) => {
  const url = new URL(endpoint, window.location.origin);
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка API ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Преобразуем структуру ответа в единый формат
    if (data && data.Entries && data.Entries.Entry) {
      return data.Entries.Entry;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Помилка запиту до [${endpoint}]:`, error.message);
    throw error;
  }
};

/**
 * Получение областей через наш API-роут
 */
export const getAreasUkrPoshta = async () => {
  try {
    const regions = await makeApiRequest("/api/ukrposhta/areas", { region_name: '' });
    
    return regions.map(region => ({
      Ref: region.REGION_ID?.toString(),
      Description: region.REGION_UA || region.REGION_EN,
      id: region.REGION_ID?.toString(),
      name: region.REGION_UA || region.REGION_EN,
      regionId: region.REGION_ID?.toString(),
      regionName: region.REGION_UA || region.REGION_EN
    }));
  } catch (error) {
    console.error("Ошибка при получении областей:", error);
    throw error; // Пробрасываем ошибку для обработки в компоненте
  }
};

/**
 * Получение городов по ID области через наш API-роут
 */
export const getCitiesUkrPoshta = async (areaId) => {
  try {
    const cities = await makeApiRequest("/api/ukrposhta/cities", { region_id: areaId });
    
    return cities.map(city => ({
      Ref: city.CITY_ID?.toString(),
      Description: city.CITY_UA || city.CITY_EN,
      id: city.CITY_ID?.toString(),
      name: city.CITY_UA || city.CITY_EN,
      cityId: city.CITY_ID?.toString(),
      cityName: city.CITY_UA || city.CITY_EN
    }));
  } catch (error) {
    console.error("Ошибка при получении городов:", error);
    throw error;
  }
};

/**
 * Получение отделений по ID города через наш API-роут
 */
export const getBranchesUkrPoshta = async (cityId, type = "branch") => {
  try {
    const offices = await makeApiRequest("/api/ukrposhta/branches", { cityId });
    
    return offices.map(office => ({
      Ref: office.ID?.toString(),
      Description: office.PO_SHORT || office.PO_LONG || office.ADDRESS,
      id: office.ID?.toString(),
      name: office.PO_SHORT || office.PO_LONG,
      postOfficeId: office.ID?.toString(),
      postOfficeName: office.PO_SHORT || office.PO_LONG,
      type: office.TYPE_ACRONYM || "branch",
      address: office.ADDRESS,
      postcode: office.POSTCODE
    }));
  } catch (error) {
    console.error("Ошибка при получении отделений:", error);
    throw error;
  }
};

/**
 * Статические данные для областей (резервный вариант)
 */
export const getStaticAreasUkrPoshta = async () => {
  return [
    { Ref: "286", Description: "Київ", id: "286", name: "Київ", regionId: "286", regionName: "Київ" },
    { Ref: "270", Description: "Київська", id: "270", name: "Київська", regionId: "270", regionName: "Київська" },
    { Ref: "271", Description: "Вінницька", id: "271", name: "Вінницька", regionId: "271", regionName: "Вінницька" },
    { Ref: "272", Description: "Волинська", id: "272", name: "Волинська", regionId: "272", regionName: "Волинська" },
    { Ref: "273", Description: "Дніпропетровська", id: "273", name: "Дніпропетровська", regionId: "273", regionName: "Дніпропетровська" },
    { Ref: "274", Description: "Донецька", id: "274", name: "Донецька", regionId: "274", regionName: "Донецька" },
    { Ref: "275", Description: "Житомирська", id: "275", name: "Житомирська", regionId: "275", regionName: "Житомирська" },
    { Ref: "276", Description: "Закарпатська", id: "276", name: "Закарпатська", regionId: "276", regionName: "Закарпатська" },
    { Ref: "277", Description: "Запорізька", id: "277", name: "Запорізька", regionId: "277", regionName: "Запорізька" },
    { Ref: "278", Description: "Івано-Франківська", id: "278", name: "Івано-Франківська", regionId: "278", regionName: "Івано-Франківська" },
    { Ref: "279", Description: "Кіровоградська", id: "279", name: "Кіровоградська", regionId: "279", regionName: "Кіровоградська" },
    { Ref: "280", Description: "Луганська", id: "280", name: "Луганська", regionId: "280", regionName: "Луганська" },
    { Ref: "281", Description: "Львівська", id: "281", name: "Львівська", regionId: "281", regionName: "Львівська" },
    { Ref: "282", Description: "Миколаївська", id: "282", name: "Миколаївська", regionId: "282", regionName: "Миколаївська" },
    { Ref: "283", Description: "Одеська", id: "283", name: "Одеська", regionId: "283", regionName: "Одеська" },
    { Ref: "284", Description: "Полтавська", id: "284", name: "Полтавська", regionId: "284", regionName: "Полтавська" },
    { Ref: "285", Description: "Рівненська", id: "285", name: "Рівненська", regionId: "285", regionName: "Рівненська" },
    { Ref: "287", Description: "Сумська", id: "287", name: "Сумська", regionId: "287", regionName: "Сумська" },
    { Ref: "288", Description: "Тернопільська", id: "288", name: "Тернопільська", regionId: "288", regionName: "Тернопільська" },
    { Ref: "289", Description: "Харківська", id: "289", name: "Харківська", regionId: "289", regionName: "Харківська" },
    { Ref: "290", Description: "Херсонська", id: "290", name: "Херсонська", regionId: "290", regionName: "Херсонська" },
    { Ref: "291", Description: "Хмельницька", id: "291", name: "Хмельницька", regionId: "291", regionName: "Хмельницька" },
    { Ref: "292", Description: "Черкаська", id: "292", name: "Черкаська", regionId: "292", regionName: "Черкаська" },
    { Ref: "293", Description: "Чернівецька", id: "293", name: "Чернівецька", regionId: "293", regionName: "Чернівецька" },
    { Ref: "294", Description: "Чернігівська", id: "294", name: "Чернігівська", regionId: "294", regionName: "Чернігівська" }
  ];
};

/**
 * Статические данные для городов (резервный вариант)
 */
export const getStaticCitiesUkrPoshta = async (areaId) => {
  const citiesByRegion = {
    "286": [ // Київ
      { Ref: "29713", Description: "Київ", id: "29713", name: "Київ", cityId: "29713", cityName: "Київ" }
    ],
    "270": [ // Київська
      { Ref: "10483", Description: "Біла Церква", id: "10483", name: "Біла Церква", cityId: "10483", cityName: "Біла Церква" },
      { Ref: "10500", Description: "Бориспіль", id: "10500", name: "Бориспіль", cityId: "10500", cityName: "Бориспіль" },
      { Ref: "10512", Description: "Бровари", id: "10512", name: "Бровари", cityId: "10512", cityName: "Бровари" }
    ],
    "281": [ // Львівська
      { Ref: "30001", Description: "Львів", id: "30001", name: "Львів", cityId: "30001", cityName: "Львів" }
    ]
  };
  
  return citiesByRegion[areaId] || [];
};

/**
 * Статические данные для отделений (резервный вариант)
 */
export const getStaticBranchesUkrPoshta = async (cityId, type = "branch") => {
  const branchesByCity = {
    "29713": [ // Київ
      { Ref: "2700", Description: "Київ 1 (вул. Хрещатик, 22)", id: "2700", name: "Київ 1", postOfficeId: "2700", postOfficeName: "Київ 1", type: "branch", address: "вул. Хрещатик, 22", postcode: "01001" },
      { Ref: "2701", Description: "Київ 2 (вул. Велика Васильківська, 1)", id: "2701", name: "Київ 2", postOfficeId: "2701", postOfficeName: "Київ 2", type: "branch", address: "вул. Велика Васильківська, 1", postcode: "01002" }
    ],
    "10483": [ // Біла Церква
      { Ref: "2800", Description: "Біла Церква 1 (вул. Соборна, 25)", id: "2800", name: "Біла Церква 1", postOfficeId: "2800", postOfficeName: "Біла Церква 1", type: "branch", address: "вул. Соборна, 25", postcode: "09101" }
    ],
    "30001": [ // Львів
      { Ref: "2900", Description: "Львів 1 (пл. Ринок, 1)", id: "2900", name: "Львів 1", postOfficeId: "2900", postOfficeName: "Львів 1", type: "branch", address: "пл. Ринок, 1", postcode: "79001" }
    ]
  };
  
  return branchesByCity[cityId] || [];
};