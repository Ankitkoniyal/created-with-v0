import { Language, getTranslation } from "./translations"

// Category translation mapping
const CATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  "Home Appliances": { en: "Home Appliances", fr: "Électroménagers" },
  "Electronics": { en: "Electronics", fr: "Électronique" },
  "Services": { en: "Services", fr: "Services" },
  "Vehicles": { en: "Vehicles", fr: "Véhicules" },
  "Furniture": { en: "Furniture", fr: "Meubles" },
  "Mobile": { en: "Mobile", fr: "Mobile" },
  "Real Estate": { en: "Real Estate", fr: "Immobilier" },
  "Fashion & Beauty": { en: "Fashion & Beauty", fr: "Mode & Beauté" },
  "Pets & Animals": { en: "Pets & Animals", fr: "Animaux de compagnie" },
  "Sports": { en: "Sports", fr: "Sports" },
  "Books & Education": { en: "Books & Education", fr: "Livres & Éducation" },
  "Free Stuff": { en: "Free Stuff", fr: "Articles gratuits" },
}

// Subcategory translations
const SUBCATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Home Appliances
  "Coffee Makers": { en: "Coffee Makers", fr: "Machines à café" },
  "Cookers": { en: "Cookers", fr: "Cuisinières" },
  "Dishwashers": { en: "Dishwashers", fr: "Lave-vaisselle" },
  "Heaters": { en: "Heaters", fr: "Chauffages" },
  "Irons": { en: "Irons", fr: "Fers à repasser" },
  "Microwaves": { en: "Microwaves", fr: "Micro-ondes" },
  "Juicers & Blenders": { en: "Juicers & Blenders", fr: "Centrifugeuses & Blenders" },
  "Refrigerators & Freezers": { en: "Refrigerators & Freezers", fr: "Réfrigérateurs & Congélateurs" },
  "Gas Stoves": { en: "Gas Stoves", fr: "Cuisinières à gaz" },
  "Ovens": { en: "Ovens", fr: "Fours" },
  "Toasters": { en: "Toasters", fr: "Grille-pain" },
  "Vacuums": { en: "Vacuums", fr: "Aspirateurs" },
  "Other Home Appliances": { en: "Other Home Appliances", fr: "Autres électroménagers" },
  
  // Electronics
  "Laptops": { en: "Laptops", fr: "Ordinateurs portables" },
  "Tablets": { en: "Tablets", fr: "Tablettes" },
  "Cameras": { en: "Cameras", fr: "Appareils photo" },
  "Headphones": { en: "Headphones", fr: "Écouteurs" },
  "Computers": { en: "Computers", fr: "Ordinateurs" },
  "TV & Audio": { en: "TV & Audio", fr: "TV & Audio" },
  "Other Electronics": { en: "Other Electronics", fr: "Autres électroniques" },
  
  // Vehicles
  "Cars": { en: "Cars", fr: "Voitures" },
  "Trucks": { en: "Trucks", fr: "Camions" },
  "Motorcycles": { en: "Motorcycles", fr: "Motos" },
  "Scooters": { en: "Scooters", fr: "Scooters" },
  "Bicycles": { en: "Bicycles", fr: "Vélos" },
  "Classic Cars": { en: "Classic Cars", fr: "Voitures classiques" },
  "Trailers": { en: "Trailers", fr: "Remorques" },
  "Auto Parts": { en: "Auto Parts", fr: "Pièces auto" },
  "Other Vehicles": { en: "Other Vehicles", fr: "Autres véhicules" },
  
  // Mobile
  "Android Phones": { en: "Android Phones", fr: "Téléphones Android" },
  "iPhones": { en: "iPhones", fr: "iPhones" },
  "Mobile Accessories": { en: "Mobile Accessories", fr: "Accessoires mobiles" },
  "Other Mobile": { en: "Other Mobile", fr: "Autre mobile" },
  
  // Real Estate
  "Roommates": { en: "Roommates", fr: "Colocataires" },
  "For Rent": { en: "For Rent", fr: "À louer" },
  "For Sale": { en: "For Sale", fr: "À vendre" },
  "Apartments for Rent": { en: "Apartments for Rent", fr: "Appartements à louer" },
  "Houses for Rent": { en: "Houses for Rent", fr: "Maisons à louer" },
  "Rooms for Rent": { en: "Rooms for Rent", fr: "Chambres à louer" },
  "Commercial": { en: "Commercial", fr: "Commercial" },
  "Land": { en: "Land", fr: "Terrain" },
  "Other Real Estate": { en: "Other Real Estate", fr: "Autre immobilier" },
  
  // Furniture
  "Beds & Mattresses": { en: "Beds & Mattresses", fr: "Lits et matelas" },
  "Sofa & Couches": { en: "Sofa & Couches", fr: "Canapés et divans" },
  "Dining Tables": { en: "Dining Tables", fr: "Tables à manger" },
  "Chairs & Recliners": { en: "Chairs & Recliners", fr: "Chaises et fauteuils" },
  "Coffee Tables": { en: "Coffee Tables", fr: "Tables basses" },
  "TV Tables": { en: "TV Tables", fr: "Tables TV" },
  "Wardrobes": { en: "Wardrobes", fr: "Armoires" },
  "Book Shelves": { en: "Book Shelves", fr: "Étagères à livres" },
  "Other Furniture": { en: "Other Furniture", fr: "Autres meubles" },
  
  // Fashion & Beauty
  "Men Clothing": { en: "Men Clothing", fr: "Vêtements pour hommes" },
  "Women Clothing": { en: "Women Clothing", fr: "Vêtements pour femmes" },
  "Shoes": { en: "Shoes", fr: "Chaussures" },
  "Accessories": { en: "Accessories", fr: "Accessoires" },
  "Other Fashion & Beauty": { en: "Other Fashion & Beauty", fr: "Autre mode & beauté" },
  
  // Pets & Animals
  "Dogs": { en: "Dogs", fr: "Chiens" },
  "Cats": { en: "Cats", fr: "Chats" },
  "Birds": { en: "Birds", fr: "Oiseaux" },
  "Pet Supplies": { en: "Pet Supplies", fr: "Fournitures pour animaux" },
  "Other Pets & Animals": { en: "Other Pets & Animals", fr: "Autres animaux" },
  
  // Sports
  "Exercise Equipment": { en: "Exercise Equipment", fr: "Équipement d'exercice" },
  "Sportswear": { en: "Sportswear", fr: "Vêtements de sport" },
  "Outdoor Gear": { en: "Outdoor Gear", fr: "Équipement extérieur" },
  "Other Sports": { en: "Other Sports", fr: "Autres sports" },
  
  // Books & Education
  "Fiction Books": { en: "Fiction Books", fr: "Livres de fiction" },
  "Non-Fiction Books": { en: "Non-Fiction Books", fr: "Livres non-fiction" },
  "Textbooks": { en: "Textbooks", fr: "Manuels scolaires" },
  "Children Books": { en: "Children Books", fr: "Livres pour enfants" },
  "Other Books & Education": { en: "Other Books & Education", fr: "Autres livres & éducation" },
  
  // Free Stuff
  "Lost & Found": { en: "Lost & Found", fr: "Objets perdus et trouvés" },
  "Miscellaneous": { en: "Miscellaneous", fr: "Divers" },
  "Other Free Stuff": { en: "Other Free Stuff", fr: "Autres articles gratuits" },
  
  // Services
  "Nanny & Childcare": { en: "Nanny & Childcare", fr: "Nounou et garde d'enfants" },
  "Cleaners": { en: "Cleaners", fr: "Nettoyeurs" },
  "Financial & Legal": { en: "Financial & Legal", fr: "Financier et juridique" },
  "Personal Trainer": { en: "Personal Trainer", fr: "Entraîneur personnel" },
  "Food & Catering": { en: "Food & Catering", fr: "Nourriture et traiteur" },
  "Health & Beauty": { en: "Health & Beauty", fr: "Santé et beauté" },
  "Moving & Storage": { en: "Moving & Storage", fr: "Déménagement et entreposage" },
  "Music Lessons": { en: "Music Lessons", fr: "Cours de musique" },
  "Photography & Video": { en: "Photography & Video", fr: "Photographie et vidéo" },
  "Skilled Trades": { en: "Skilled Trades", fr: "Métiers spécialisés" },
  "Tutors & Languages": { en: "Tutors & Languages", fr: "Tuteurs et langues" },
  "Wedding": { en: "Wedding", fr: "Mariage" },
  "Other Services": { en: "Other Services", fr: "Autres services" },
}

/**
 * Translate a category name based on the current language
 */
export function translateCategory(categoryName: string, language: Language = "en"): string {
  return CATEGORY_TRANSLATIONS[categoryName]?.[language] || categoryName
}

/**
 * Translate a subcategory name based on the current language
 */
export function translateSubcategory(subcategoryName: string, language: Language = "en"): string {
  return SUBCATEGORY_TRANSLATIONS[subcategoryName]?.[language] || subcategoryName
}

/**
 * Get all category translations for a given language
 */
export function getCategoryTranslations(language: Language): Record<string, string> {
  const translations: Record<string, string> = {}
  Object.keys(CATEGORY_TRANSLATIONS).forEach((key) => {
    translations[key] = CATEGORY_TRANSLATIONS[key][language]
  })
  return translations
}

/**
 * Get all subcategory translations for a given language
 */
export function getSubcategoryTranslations(language: Language): Record<string, string> {
  const translations: Record<string, string> = {}
  Object.keys(SUBCATEGORY_TRANSLATIONS).forEach((key) => {
    translations[key] = SUBCATEGORY_TRANSLATIONS[key][language]
  })
  return translations
}

