// lib/category-utils.ts
export const fixSubcategory = (subcategory: string): string => {
  if (!subcategory) return '';
  
  // Convert "For Rent" to "for-rent"
  if (subcategory === 'For Rent') return 'for-rent';
  if (subcategory === 'Roommates') return 'roommates';
  if (subcategory === 'Cameras') return 'cameras';
  
  return subcategory.toLowerCase();
};
