import { FullMenuItem } from '../types';
import { RAW_FOOD_DATA_TSV } from './data/foodData';
import { RAW_BEVERAGE_DATA_TSV } from './data/beverageData';

const DB_NAME = 'MenuDatabase';
const DB_VERSION = 1; 
const STORE_NAME = 'menuItems';

let db: IDBDatabase | null = null;

// --- Helper Functions for Parsing ---

// Enhanced parseStringArray to handle various quote types and mixed cases robustly
function parseStringArray(arrStr: string | undefined | null): string[] {
  if (!arrStr || arrStr.trim() === '' || arrStr.trim().toLowerCase() === 'null') {
    return [];
  }
  let parsableStr = arrStr.trim();

  // Try JSON parsing first for properly formatted arrays like ["item1", "item2"]
  if (parsableStr.startsWith('[') && parsableStr.endsWith(']')) {
    try {
      const parsed = JSON.parse(parsableStr);
      if (Array.isArray(parsed)) {
        return parsed
          .map(String) // Ensure all elements are strings
          .map(s => s.toLowerCase().trim())
          .filter(s => s.length > 0 && s !== 'null');
      }
    } catch (e) {
      // Not a valid JSON array, proceed to comma-separated logic
      // Remove brackets for comma-separated logic if JSON parse failed
      parsableStr = parsableStr.substring(1, parsableStr.length - 1);
    }
  }

  // Comma-separated logic: handles "item1,item2" or "'item1','item2'" or '"item1","item2"'
  return parsableStr.split(',')
    .map(s => s.replace(/^['"]|['"]$/g, '').toLowerCase().trim()) // Remove leading/trailing single/double quotes, then lowercase and trim
    .filter(s => s.length > 0 && s !== 'null'); // Filter out empty or "null" strings
}


function generateItemId(idPrefix: string, idCounters: Record<string, number>): string {
  idCounters[idPrefix] = (idCounters[idPrefix] || 0) + 1;
  return `${idPrefix}${String(idCounters[idPrefix]).padStart(3, '0')}`;
}

const getColumnValue = (values: string[], headerMap: Record<string, number>, columnName: string): string | undefined => {
    const index = headerMap[columnName.toLowerCase()];
    return index !== undefined ? values[index]?.trim() : undefined;
};

// --- Food Data Parsing Helpers ---

const FOOD_CATEGORY_MAPPINGS: Record<string, { sysCat: string, prefix: string }> = {
  "bread & spread": { sysCat: "Food/Bread_Spread", prefix: "FOOD_BS_" },
  "small / vegetable": { sysCat: "Food/Small_Vegetable", prefix: "FOOD_SV_" },
  "pasta / rice": { sysCat: "Food/Pasta_Rice", prefix: "FOOD_PR_" },
  "large / sharing plate": { sysCat: "Food/Large_Sharing", prefix: "FOOD_LS_" },
  "desserts": { sysCat: "Food/Desserts", prefix: "FOOD_DS_" },
  "weekend specials": { sysCat: "Food/Weekend_Specials", prefix: "FOOD_WS_" },
};

function determineFoodCategoryAndPrefix(rawCategory: string): { systemCategory: string, idPrefix: string } {
  const mapping = FOOD_CATEGORY_MAPPINGS[rawCategory.toLowerCase()];
  if (mapping) {
    return { systemCategory: mapping.sysCat, idPrefix: mapping.prefix };
  }
  const prefixGuess = rawCategory.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  return {
    systemCategory: `Food/${rawCategory.replace(/\s+/g, '_')}`,
    idPrefix: `FOOD_${prefixGuess}_`,
  };
}

const COMMON_ALLERGEN_KEYWORDS: { [key: string]: string } = { "nut": "nuts", "pecan": "nuts", "almond": "nuts", "pistachio": "nuts", "peanut": "peanuts", "mackerel": "seafood", "anchovy": "seafood", "shrimp": "shellfish", "cheese": "dairy", "ricotta": "dairy", "milk": "dairy", "cream": "dairy", "butter": "dairy", "eggplant": "eggplant", "flour": "gluten", "bread": "gluten", "ciabatta": "gluten", "sourdough": "gluten", "fettuccine": "gluten", "pasta": "gluten", "soy": "soy", "miso": "soy", "kicap manis": "soy" };

function processFoodTagsAndAllergens(
  values: string[],
  headerMap: Record<string, number>,
  ingredientsList: string[]
): { allergens: string[], dietary_tags: string[], displayTags: string[] } {
  
  let allergensList = parseStringArray(getColumnValue(values, headerMap, 'allergens'));
  const dietaryTagsList = parseStringArray(getColumnValue(values, headerMap, 'dietary info'));
  const displayTagsSet: Set<string> = new Set(dietaryTagsList.map(t => t.charAt(0).toUpperCase() + t.slice(1)));

  if (getColumnValue(values, headerMap, 'takeaway available')?.toUpperCase() === 'TRUE') {
    displayTagsSet.add('Takeaway Available');
  } else {
    displayTagsSet.add('Dine-in Only');
  }

  const spiceLevel = getColumnValue(values, headerMap, 'spice level')?.toLowerCase();
  if (spiceLevel && spiceLevel !== 'null' && spiceLevel !== 'none' && spiceLevel !== '') {
    displayTagsSet.add('Spicy');
    if (!allergensList.includes('chili')) allergensList.push('chili');
  } else if (ingredientsList.some(ing => ing.toLowerCase().includes('chili')) || allergensList.includes('chili')) {
    displayTagsSet.add('Spicy');
    if (!allergensList.includes('chili')) allergensList.push('chili');
  }

  ingredientsList.forEach(ing => {
    const ingLower = ing.toLowerCase();
    for (const keyword in COMMON_ALLERGEN_KEYWORDS) {
      if (ingLower.includes(keyword) && !allergensList.includes(COMMON_ALLERGEN_KEYWORDS[keyword])) {
        allergensList.push(COMMON_ALLERGEN_KEYWORDS[keyword]);
      }
    }
  });

  return {
    allergens: [...new Set(allergensList.filter(a => a && a !== "null"))],
    dietary_tags: [...new Set(dietaryTagsList.filter(dt => dt && dt !== "null"))],
    displayTags: [...displayTagsSet].filter(dtag => dtag && dtag !== "null"),
  };
}


function parseFoodDataTsv(tsvData: string): FullMenuItem[] {
  const lines = tsvData.trim().split('\n');
  const rawHeaders = lines[0].split('\t');
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, i) => headerMap[h.trim().toLowerCase()] = i);
  
  const items: FullMenuItem[] = [];
  const idCounters: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length < rawHeaders.length - 3) continue;

    const rawCategory = getColumnValue(values, headerMap, 'category') || 'Unknown';
    const { systemCategory, idPrefix } = determineFoodCategoryAndPrefix(rawCategory);
    const itemId = generateItemId(idPrefix, idCounters);
    
    const ingredientsList = (getColumnValue(values, headerMap, 'ingredients') || '').split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
    const { allergens, dietary_tags, displayTags } = processFoodTagsAndAllergens(values, headerMap, ingredientsList);
    
    const portionSize = getColumnValue(values, headerMap, 'portion size');
    const shortDesc = portionSize ? `Portion: ${portionSize}` : 'Freshly prepared daily.';
    const itemDescription = `${portionSize ? `Portion: ${portionSize}. ` : ''}${ingredientsList.join(', ')}.`.trim();


    items.push({
      id: itemId,
      name: getColumnValue(values, headerMap, 'name') || 'Unnamed Item',
      description: itemDescription,
      shortDescription: shortDesc,
      price: parseFloat(getColumnValue(values, headerMap, 'price') || '0') || 0,
      imageUrl: getColumnValue(values, headerMap, 'image url') || '',
      category: systemCategory,
      ingredients: ingredientsList,
      allergens: allergens,
      dietary_tags: dietary_tags,
      displayTags: displayTags,
      available_options: [], 
      available_modifiers: [],
    });
  }
  return items;
}

// --- Beverage Data Parsing Helpers ---

const BEVERAGE_CATEGORY_MAPPINGS: Record<string, { sysCat: string, prefix: string }> = {
  "craft drinks": { sysCat: "Beverages/Craft_Drinks", prefix: "BEV_CD_" },
  "non-alcoholic wine": { sysCat: "Beverages/Non_Alcoholic_Wine", prefix: "BEV_NAW_" },
  "sharing jug": { sysCat: "Beverages/Sharing_Jug", prefix: "BEV_SJ_" }, // Singular key for mapping
  "soda": { sysCat: "Beverages/Soda", prefix: "BEV_SD_" }, // Singular key for mapping
  "house pour - white": { sysCat: "Beverages/House_Pours_White", prefix: "BEV_HPW_" },
  "house pour - red": { sysCat: "Beverages/House_Pours_Red", prefix: "BEV_HPR_" },
  "sparkling": { sysCat: "Beverages/Sparkling_Wines", prefix: "BEV_SPK_" },
  "white": { sysCat: "Beverages/White_Wines", prefix: "BEV_WHT_" },
  "red": { sysCat: "Beverages/Red_Wines", prefix: "BEV_RED_" },
};

function determineBeverageCategoryAndPrefix(rawCategory: string): { systemCategory: string, idPrefix: string } {
  const mapping = BEVERAGE_CATEGORY_MAPPINGS[rawCategory.toLowerCase()];
  if (mapping) {
    return { systemCategory: mapping.sysCat, idPrefix: mapping.prefix };
  }
  // Fallback for categories not in mapping (e.g. Coffee if not added to MAPPINGS)
  const prefixGuess = rawCategory.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  return {
    systemCategory: `Beverages/${rawCategory.replace(/\s+/g, '_')}`, // e.g. Beverages/Coffee
    idPrefix: `BEV_${prefixGuess}_`,
  };
}

function processBeveragePriceAndName(
  initialItemName: string,
  priceRaw: string,
  unit: string
): { price: number, itemName: string, itemDescriptionUpdate: string, shortDescUpdate: string } {
  let price = 0;
  let itemName = initialItemName;
  let itemDescriptionUpdate = '';
  let shortDescUpdate = unit ? `Unit: ${unit}` : 'Refreshing choice.';


  if (priceRaw.includes('/')) {
    const prices = priceRaw.split('/');
    price = parseFloat(prices[0]);
    if (unit.toLowerCase().includes("glass/bottle")) {
        itemName += " (Glass)";
        shortDescUpdate = "Glass. Bottle option available.";
    }
    itemDescriptionUpdate = `Bottle available for RM${prices[1]}.`;
  } else {
    price = parseFloat(priceRaw);
  }
  return { price, itemName, itemDescriptionUpdate, shortDescUpdate };
}

function processWineDetails(wineDetailsRaw: string | undefined): { wineDescriptionUpdate: string, wineDisplayTags: string[], shortDescWinePart: string } {
  let wineDescriptionUpdate = '';
  const wineDisplayTags: string[] = [];
  let shortDescWinePart = '';

  if (wineDetailsRaw && wineDetailsRaw.trim().startsWith('{')) {
    try {
      const wineDetailsStructured: Record<string, string> = JSON.parse(wineDetailsRaw);
      const wineDescParts = [];
      if (wineDetailsStructured.grape) { 
        wineDisplayTags.push(wineDetailsStructured.grape); 
        wineDescParts.push(`Grape: ${wineDetailsStructured.grape}`);
        shortDescWinePart += `${wineDetailsStructured.grape}. `;
      }
      if (wineDetailsStructured.origin) { 
        wineDisplayTags.push(wineDetailsStructured.origin); 
        wineDescParts.push(`Origin: ${wineDetailsStructured.origin}`); 
        shortDescWinePart += `From ${wineDetailsStructured.origin}.`;
      }
      if (wineDetailsStructured.year) { wineDisplayTags.push(wineDetailsStructured.year); wineDescParts.push(`Year: ${wineDetailsStructured.year}`); }
      if (wineDetailsStructured.type && !wineDisplayTags.includes(wineDetailsStructured.type)) { wineDisplayTags.push(wineDetailsStructured.type); }
      if (wineDescParts.length > 0) {
        wineDescriptionUpdate = wineDescParts.join('. ') + ".";
      }
    } catch (e) {
      console.warn(`Failed to parse wine details: ${wineDetailsRaw}`, e);
      wineDescriptionUpdate = `Wine notes: ${wineDetailsRaw}.`;
      shortDescWinePart = "Unique wine characteristics.";
    }
  }
  return { wineDescriptionUpdate, wineDisplayTags, shortDescWinePart };
}

function processBeverageTags(
  values: string[],
  headerMap: Record<string, number>,
  initialAllergens: string[],
  wineDisplayTags: string[]
): { allergens: string[], displayTags: string[] } {
  const displayTagsSet: Set<string> = new Set(wineDisplayTags);
  let finalAllergens = [...initialAllergens];

  const isAlcoholic = getColumnValue(values, headerMap, 'alcoholic')?.toUpperCase() === 'TRUE';
  displayTagsSet.add(isAlcoholic ? 'Alcoholic' : 'Non-Alcoholic');
  if(isAlcoholic && !finalAllergens.includes('alcohol')) finalAllergens.push('alcohol');

  if (getColumnValue(values, headerMap, 'takeaway available')?.toUpperCase() === 'TRUE') {
    displayTagsSet.add('Takeaway Available');
  } else {
    displayTagsSet.add('Dine-in Only');
  }

  const unit = getColumnValue(values, headerMap, 'unit') || '';
  if (unit && !displayTagsSet.has(unit)) displayTagsSet.add(unit); // Add unit if not already present (e.g. from wineDisplayTags)
  
  return {
    allergens: [...new Set(finalAllergens.filter(a => a && a !== "null"))],
    displayTags: [...displayTagsSet].filter(dtag => dtag && dtag !== "null"),
  };
}

function parseBeverageDataTsv(tsvData: string): FullMenuItem[] {
  const lines = tsvData.trim().split('\n');
  const rawHeaders = lines[0].split('\t');
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, i) => headerMap[h.trim().toLowerCase()] = i);

  const items: FullMenuItem[] = [];
  const idCounters: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length < Math.min(rawHeaders.length, 8)) continue;

    const rawCategoryFromTSV = getColumnValue(values, headerMap, 'category') || 'Unknown';
    const { systemCategory, idPrefix } = determineBeverageCategoryAndPrefix(rawCategoryFromTSV);
    const itemId = generateItemId(idPrefix, idCounters);
    
    let initialItemName = getColumnValue(values, headerMap, 'name') || 'Unnamed Beverage';
    let baseDescription = getColumnValue(values, headerMap, 'ingredients') || '';
    const initialAllergens = parseStringArray(getColumnValue(values, headerMap, 'allergens'));
    let shortDesc = '';
    
    const { price, itemName, itemDescriptionUpdate: priceDescUpdate, shortDescUpdate: unitShortDesc } = processBeveragePriceAndName(
      initialItemName,
      getColumnValue(values, headerMap, 'price') || '0',
      getColumnValue(values, headerMap, 'unit') || ''
    );
    shortDesc = unitShortDesc;
    if (priceDescUpdate) baseDescription += (baseDescription ? ". " : "") + priceDescUpdate;

    const { wineDescriptionUpdate, wineDisplayTags, shortDescWinePart } = processWineDetails(getColumnValue(values, headerMap, 'wine details'));
    if (wineDescriptionUpdate) baseDescription += (baseDescription ? ". " : "") + wineDescriptionUpdate;
    if (shortDescWinePart) shortDesc = shortDescWinePart; // Wine details can override unit for shortDesc for wines
    
    const { allergens, displayTags } = processBeverageTags(values, headerMap, initialAllergens, wineDisplayTags);
    
    const simpleIngredients = (getColumnValue(values, headerMap, 'ingredients') || '').split(/,|\band\b|\bwith\b/)
        .map(s => s.replace(/\./g, '').toLowerCase().trim())
        .filter(s => s.length > 3 && s.length < 25 && !s.includes("available for rm"))
        .slice(0, 5); 

    items.push({
      id: itemId,
      name: itemName,
      description: baseDescription.trim(),
      shortDescription: shortDesc.trim(),
      price: price,
      imageUrl: '', 
      category: systemCategory, 
      ingredients: [...new Set(simpleIngredients.filter(s => s && s !== "null"))],
      allergens: allergens,
      dietary_tags: [], 
      displayTags: displayTags,
      available_options: [],
      available_modifiers: [],
    });
  }
  return items;
}

// --- Data Organization & Initialization ---

const ORGANIZED_FOOD_ITEMS: Record<string, FullMenuItem[]> = {
  Bread_Spread: [], Small_Vegetable: [], Pasta_Rice: [], Large_Sharing: [], Desserts: [], Weekend_Specials: [],
};
parseFoodDataTsv(RAW_FOOD_DATA_TSV).forEach(item => {
  const subCategory = item.category.split('/')[1];
  if (subCategory && ORGANIZED_FOOD_ITEMS[subCategory]) {
    ORGANIZED_FOOD_ITEMS[subCategory].push(item);
  } else if (subCategory) { 
    console.warn(`Food subCategory '${subCategory}' from item '${item.id}' not pre-defined in ORGANIZED_FOOD_ITEMS. Creating it.`);
    ORGANIZED_FOOD_ITEMS[subCategory] = [item];
  } else {
    console.warn(`Item '${item.id}' has invalid food category: ${item.category}`);
  }
});

const ORGANIZED_BEVERAGE_ITEMS: Record<string, FullMenuItem[]> = {
  Craft_Drinks: [], 
  Non_Alcoholic_Wine: [], 
  Sharing_Jug: [], 
  Soda: [],        
  House_Pours_White: [], 
  House_Pours_Red: [], 
  Sparkling_Wines: [], 
  White_Wines: [], 
  Red_Wines: [],
};
parseBeverageDataTsv(RAW_BEVERAGE_DATA_TSV).forEach(item => {
  const subCategory = item.category.split('/')[1]; 
  if (subCategory && ORGANIZED_BEVERAGE_ITEMS.hasOwnProperty(subCategory)) { 
    ORGANIZED_BEVERAGE_ITEMS[subCategory].push(item);
  } else if (subCategory) {
    console.warn(`Beverage subCategory '${subCategory}' from item '${item.id}' not pre-defined in ORGANIZED_BEVERAGE_ITEMS. Creating it.`);
    ORGANIZED_BEVERAGE_ITEMS[subCategory] = [item];
  } else {
     console.warn(`Item '${item.id}' has invalid beverage category: ${item.category}`);
  }
});


const INITIAL_MENU_DATA_STRUCTURE = {
  Food: ORGANIZED_FOOD_ITEMS,
  Beverages: { 
    ...ORGANIZED_BEVERAGE_ITEMS, 
    Coffee: [ 
      { name: "Latte", id: "BEV_COF_001", description: "Espresso with steamed milk and foam. Default: Hot, Whole Milk.", shortDescription: "Classic Italian coffee.", price: 12.00, ingredients: ["espresso", "whole milk"], allergens: ["dairy"], dietary_tags: [], displayTags: ["Coffee", "Takeaway Available", "Hot", "Whole Milk"], imageUrl: "https://i.imgur.com/KtfbYQb.jpeg", category: "Beverages/Coffee", available_options: [{id: "OPT_COF_Milk", name: "Milk Choice", values: ["Whole Milk", "Oat Milk", "Almond Milk"], default: "Whole Milk"}, {id: "OPT_COF_Temp", name: "Temperature", values: ["Hot", "Iced"], default: "Hot"}], available_modifiers: [{id: "MOD_COF_Oat", name: "Oat Milk", price_change: 2.00, description: "Substitute with Oat Milk."},{id: "MOD_COF_Almond", name: "Almond Milk", price_change: 2.00, description: "Substitute with Almond Milk."},{id: "MOD_COF_Iced", name: "Iced", price_change: 1.00, description: "Served over ice."},{id: "MOD_COF_XShot", name: "Extra Espresso Shot", price_change: 3.00, description: "Add an extra shot of espresso."},{name: "Decaf", id: "MOD_COF_Decaf", price_change: 0.00, description: "Decaf espresso."}] }
    ]
  }
};

function getInitialMenuItems(): FullMenuItem[] {
  const items: FullMenuItem[] = [];
  Object.values(INITIAL_MENU_DATA_STRUCTURE.Food).forEach(categoryItems => {
    if (Array.isArray(categoryItems)) items.push(...categoryItems);
  });
  Object.values(INITIAL_MENU_DATA_STRUCTURE.Beverages).forEach(categoryItems => {
    if (Array.isArray(categoryItems)) items.push(...categoryItems);
  });
  return items;
}

// --- IndexedDB Service ---
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        const store = tempDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('name', 'name', { unique: false });
        console.log('IndexedDB object store created/upgraded.');
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB connection successful.');
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('Error opening IndexedDB.');
    };
  });
}

export async function populateInitialData(): Promise<void> {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const countRequest = store.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        const initialItems = getInitialMenuItems();
        console.log(`Populating DB with ${initialItems.length} items.`);
        if (initialItems.length === 0) {
            console.warn("No initial items to populate. Check TSV parsing.");
        }
        initialItems.forEach(item => {
          try {
            store.add(item);
          } catch (e) {
            console.error("Error adding item to store:", item.id, item.name, e);
          }
        });
        transaction.oncomplete = () => {
          console.log('Initial menu data populated into IndexedDB.');
          resolve();
        };
        transaction.onerror = () => {
          console.error('Error populating initial data:', transaction.error);
          reject('Error populating initial data.');
        };
      } else {
        console.log('IndexedDB already contains data. Skipping population.');
        resolve();
      }
    };
    countRequest.onerror = () => {
      console.error('Error counting items in DB:', countRequest.error);
      reject('Error counting items in DB.');
    };
  });
}

export async function getAllMenuItems(): Promise<FullMenuItem[]> {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as FullMenuItem[]);
    };
    request.onerror = () => {
      console.error('Error fetching all menu items:', request.error);
      reject('Error fetching all menu items.');
    };
  });
}

export async function addMenuItem(item: FullMenuItem): Promise<void> {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(item);
    request.onsuccess = () => resolve();
    request.onerror = () => { console.error('Error adding menu item:', request.error); reject('Error adding menu item.'); };
  });
}

export async function updateMenuItem(item: FullMenuItem): Promise<void> {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item); 
    request.onsuccess = () => resolve();
    request.onerror = () => { console.error('Error updating menu item:', request.error); reject('Error updating menu item.'); };
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => { console.error('Error deleting menu item:', request.error); reject('Error deleting menu item.'); };
  });
}
 
export async function clearMenuData(): Promise<void> {
  const currentDb = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => {
      console.log('Menu data cleared from IndexedDB.');
      db = null; 
      resolve();
    };
    request.onerror = () => { console.error('Error clearing menu data:', request.error); reject('Error clearing menu data.'); };
  });
}