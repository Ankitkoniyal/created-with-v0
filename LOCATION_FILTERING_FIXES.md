# Location Filtering Fixes

## ✅ **Issues Fixed**

### **1. Location Filtering Not Working Properly**
**Problem**: Location filters were too broad and not matching correctly
- Used simple `ilike` with wildcards that matched too many results
- Didn't handle city and province combinations properly
- OR conditions were too loose

**Solution**:
- Improved parsing of location strings (handles "City, Province" format)
- More precise matching when both city and province are provided
- Better handling of single-term searches (city OR province)

### **2. Non-English Locations (French/English)**
**Problem**: French city names (like "Montréal", "Québec") weren't matching English searches
- Accented characters weren't normalized
- French city names didn't match English equivalents

**Solution**:
- Added accent normalization (removes é, è, ê, à, â, î, ï, ô, ù, û)
- Handles both French and English city name variations
- Normalizes province names (handles abbreviations like "ON", "QC", "BC")
- Supports both full province names and abbreviations

## 🔧 **Technical Changes**

### **Files Modified**:

1. **`components/search/search-results.tsx`**
   - Updated location filtering logic
   - Added accent normalization
   - Improved city/province parsing

2. **`components/product-grid.tsx`**
   - Updated location filtering in main query
   - Updated location filtering in `loadMore` function
   - Consistent handling across all queries

3. **`lib/location-filter-utils.ts`** (New)
   - Utility functions for location normalization
   - French/English city name mappings
   - Province variant handling

## 📋 **How It Works Now**

### **Location Filter Format**:
- `"Toronto, ON"` → Matches city "Toronto" AND province "Ontario" or "ON"
- `"Montreal"` → Matches "Montreal" or "Montréal" (handles accents)
- `"Quebec"` → Matches "Quebec" or "Québec" or "QC"
- `"ON"` → Matches any city in Ontario

### **Normalization Process**:
1. Converts to lowercase
2. Removes accents (é → e, à → a, etc.)
3. Handles French/English variations
4. Supports province abbreviations

### **Matching Logic**:
- **City + Province**: Both must match (more precise)
- **City only**: Matches city with accent variations
- **Province only**: Matches province with all variants (full name, abbreviation, French name)

## 🧪 **Testing**

To test the fixes:

1. **Test French City Names**:
   - Search for "Montreal" → Should match "Montréal" products
   - Search for "Quebec" → Should match "Québec" products

2. **Test Province Abbreviations**:
   - Search for "Toronto, ON" → Should match Toronto, Ontario
   - Search for "Vancouver, BC" → Should match Vancouver, British Columbia

3. **Test Precise Matching**:
   - Search for "Toronto, ON" → Should ONLY show Toronto, Ontario products
   - Should NOT show other cities in Ontario

4. **Test Single Terms**:
   - Search for "ON" → Should show all Ontario products
   - Search for "Toronto" → Should show all Toronto products (any province)

## ⚠️ **Important Notes**

- The filtering now uses accent normalization, so "Montréal" and "Montreal" are treated the same
- Province abbreviations (ON, QC, BC) are automatically recognized
- The filtering is case-insensitive
- Both `city` and `province` columns are checked for matches

## 🚀 **Next Steps (Optional)**

If you want to further improve location filtering:

1. **Add more French city mappings** in `lib/location-filter-utils.ts`
2. **Add fuzzy matching** for typos (e.g., "Tornto" → "Toronto")
3. **Add location suggestions** based on partial matches
4. **Cache normalized location data** for better performance

---

**All location filtering issues should now be fixed!** ✅

