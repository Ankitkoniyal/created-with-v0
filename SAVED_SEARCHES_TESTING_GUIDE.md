# ✅ Saved Searches - Testing Guide

## 🎉 **What's Been Implemented**

### ✅ **Backend (Complete)**
1. **Database Table**: `saved_searches` table created
2. **API Endpoints**: `/api/saved-searches` (GET, POST, DELETE, PATCH)
3. **Security**: Row Level Security (RLS) policies in place

### ✅ **Frontend (Complete)**
1. **Dashboard Page**: `/dashboard/saved-searches` - Manage all saved searches
2. **Save Button**: Added to search results page
3. **Navigation**: Added "Saved Searches" to dashboard menu

## 🧪 **How to Test**

### **Step 1: Run the SQL Migration**
If you haven't already, run:
```sql
-- Run this file in your Supabase SQL editor
scripts/29_add_saved_searches.sql
```

### **Step 2: Test Saving a Search**

1. **Go to Search Page**
   - Navigate to `/search`
   - Enter a search query (e.g., "iPhone")
   - Or select a category
   - Apply filters (location, price range, etc.)

2. **Save the Search**
   - Look for the "Save Search" button in the top right of search results
   - Click it
   - Enter a name for your search (e.g., "iPhone deals")
   - Click "Save Search"
   - You should see a success message

3. **View Saved Searches**
   - Go to Dashboard → "Saved Searches" (in the left menu)
   - You should see your saved search listed
   - It shows:
     - Search name
     - Search criteria (query, category, location, price range)
     - Active/Inactive toggle
     - Email alerts toggle
     - Edit and delete buttons

### **Step 3: Test Managing Saved Searches**

1. **Edit Search Name**
   - Click the edit icon (pencil) next to a saved search
   - Change the name
   - Click the checkmark to save

2. **Toggle Active/Inactive**
   - Use the "Active" switch to activate/deactivate a search
   - Inactive searches won't send alerts

3. **Toggle Email Alerts**
   - Use the "Email Alerts" switch
   - When ON, you'll get email notifications for new matches (when email system is set up)

4. **View Search Results**
   - Click "View Results" button
   - It takes you back to the search with all filters applied

5. **Delete Search**
   - Click the trash icon
   - Confirm deletion
   - Search is removed

### **Step 4: Test Edge Cases**

1. **Try Saving Duplicate Search**
   - Save the same search twice
   - Should show error: "This search is already saved"

2. **Save Without Login**
   - Log out
   - Try to save a search
   - Should redirect to login page

3. **Save Empty Search**
   - Go to search page without any query or category
   - "Save Search" button should not appear

## 📋 **What Each Feature Does**

### **Save Search Button** (Search Results Page)
- Only shows when user is logged in
- Only shows when there's a search query or category
- Opens dialog to name the search
- Saves all current filters (query, category, location, price, condition)

### **Saved Searches Dashboard**
- Lists all saved searches
- Shows search criteria in readable format
- Allows editing, activating/deactivating, and deleting
- "View Results" button to run the search again

### **Email Alerts** (Ready for Integration)
- Toggle exists in UI
- Database field `email_alerts` is ready
- You can add email notification logic later

## 🔍 **What to Check**

✅ **Database**
- Table `saved_searches` exists
- RLS policies are active
- Indexes are created

✅ **API**
- `/api/saved-searches` GET returns your searches
- `/api/saved-searches` POST saves a new search
- `/api/saved-searches` PATCH updates a search
- `/api/saved-searches` DELETE removes a search

✅ **UI**
- "Saved Searches" appears in dashboard menu
- Save button appears on search results
- Dashboard page loads and shows searches
- All buttons work (edit, delete, toggle, view results)

## 🐛 **Troubleshooting**

### **"Failed to save search"**
- Check if you're logged in
- Check browser console for errors
- Verify API endpoint is accessible

### **"This search is already saved"**
- This is expected behavior - prevents duplicates
- Edit existing search instead

### **Save button not showing**
- Make sure you're logged in
- Make sure you have a search query or category selected

### **Can't see saved searches**
- Check if you're logged in
- Check browser console for errors
- Verify database table exists

## 🚀 **Next Steps (Optional)**

1. **Email Notifications** - Set up email service to send alerts when new items match saved searches
2. **Search Count** - Show how many new items match each saved search
3. **Auto-naming** - Auto-generate better default names for saved searches

---

**Everything is ready to test!** 🎉

Try it out and let me know if you encounter any issues!

