# Database Tables Analysis

## Current Tables in Supabase:

### ✅ **user_ratings** - NEEDED
- **Purpose**: Stores user ratings with integrated comments
- **Status**: Actively used
- **Contains**:
  - Overall rating (1-5 stars)
  - Category ratings (response time, product quality, communication, overall experience)
  - Comment field (integrated)
- **Used in**:
  - `app/api/ratings/route.ts` (GET, POST, DELETE)
  - `app/product/[id]/page.tsx`
  - `components/user-ratings.tsx`
  - `components/product-grid.tsx`
  - `components/latest-ads.tsx`

### ✅ **user_rating_stats** - NEEDED (VIEW, not table)
- **Purpose**: Aggregated statistics from user_ratings
- **Status**: Actively used for performance
- **Contains**: 
  - Total ratings count
  - Average ratings (overall + category-specific)
  - Star distribution (1-5 stars)
  - Count of ratings with comments
- **Used in**:
  - `app/api/ratings/route.ts`
  - `app/product/[id]/page.tsx`
  - `components/product-grid.tsx`
  - `components/latest-ads.tsx`

### ❌ **user_comments** - NOT NEEDED (REMOVE)
- **Purpose**: Separate comments table (old implementation)
- **Status**: **DEPRECATED** - Comments are now in user_ratings table
- **Reason for removal**:
  - Comments are now integrated into user_ratings table (comment field)
  - UserComments component is no longer used (removed from seller profile)
  - Comments API route is not being called anymore
  - Only referenced in backup/restore (should be removed)

## Recommendation:

1. **Keep**: `user_ratings` table ✅
2. **Keep**: `user_rating_stats` VIEW ✅
3. **Remove**: `user_comments` table ❌

## Migration Plan:

1. Remove user_comments from backup/restore routes
2. Mark comments API route as deprecated (or delete)
3. Create migration script to drop user_comments table
4. (Optional) Delete UserComments component if not needed

