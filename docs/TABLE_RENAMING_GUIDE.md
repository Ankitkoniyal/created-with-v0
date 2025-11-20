# Table Renaming Guide

## Quick Reference: How to Rename a Table

### Step 1: Find All References
```bash
# Use the helper script
./scripts/find_table_references.sh TABLE_NAME

# Or manually search
grep -r "\.from\([\"']OLD_TABLE_NAME[\"']\)" . --include="*.ts" --include="*.tsx"
```

### Step 2: Update Code References

#### TypeScript/JavaScript Files
Replace all instances of:
```typescript
.from("old_table_name")
```
with:
```typescript
.from("new_table_name")
```

#### SQL Scripts
Update all SQL files in `scripts/` directory:
```sql
-- Old
SELECT * FROM old_table_name;

-- New
SELECT * FROM new_table_name;
```

#### API Routes
Update all API route files in `app/api/` directory.

### Step 3: Update Database

```sql
-- Rename the table
ALTER TABLE old_table_name RENAME TO new_table_name;

-- Verify the rename
SELECT tablename FROM pg_tables WHERE tablename = 'new_table_name';
```

### Step 4: Update RLS Policies

RLS policies are automatically updated when you rename a table, but verify:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'new_table_name';
```

### Step 5: Update Foreign Keys

Check if any tables have foreign keys referencing the renamed table:
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'new_table_name';
```

### Step 6: Update Views

If any views reference the table:
```sql
-- Find views that reference the table
SELECT viewname, definition 
FROM pg_views 
WHERE definition LIKE '%old_table_name%';

-- Recreate views with new table name
CREATE OR REPLACE VIEW view_name AS
SELECT * FROM new_table_name;
```

### Step 7: Update Triggers

Check for triggers:
```sql
-- Find triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'new_table_name';
```

### Step 8: Update Functions

Check for functions that reference the table:
```sql
-- Find functions
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%old_table_name%';
```

### Step 9: Test Everything

1. Test all features that use the table
2. Check admin panels
3. Verify API endpoints
4. Test user flows
5. Check error logs

### Step 10: Update Documentation

Update:
- `docs/DATABASE_TABLES_COMPLETE_ANALYSIS.md`
- Any other documentation referencing the table

---

## Common Issues & Solutions

### Issue: "Table does not exist" error
**Solution:** The table might be in a different schema. Check:
```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'table_name';
```

### Issue: Foreign key constraint errors
**Solution:** Update foreign key constraints:
```sql
-- Drop old constraint
ALTER TABLE referencing_table DROP CONSTRAINT constraint_name;

-- Add new constraint
ALTER TABLE referencing_table 
ADD CONSTRAINT constraint_name 
FOREIGN KEY (column) REFERENCES new_table_name(id);
```

### Issue: RLS policies not working
**Solution:** Recreate policies if needed:
```sql
-- Drop old policies
DROP POLICY IF EXISTS "policy_name" ON new_table_name;

-- Create new policies
CREATE POLICY "policy_name" ON new_table_name
FOR SELECT USING (condition);
```

---

## Checklist

Before renaming:
- [ ] Backup database
- [ ] Find all references
- [ ] Update all code files
- [ ] Update SQL scripts
- [ ] Test in development
- [ ] Update documentation

After renaming:
- [ ] Verify table renamed in database
- [ ] Check RLS policies
- [ ] Verify foreign keys
- [ ] Test all features
- [ ] Update documentation
- [ ] Deploy to production

---

## Example: Renaming `products` to `listings`

### 1. Find References
```bash
./scripts/find_table_references.sh products
# Found 100+ references
```

### 2. Update Code (100+ files)
```typescript
// Before
.from("products")

// After
.from("listings")
```

### 3. Update Database
```sql
ALTER TABLE products RENAME TO listings;
```

### 4. Update Foreign Keys
```sql
-- Check what references products
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND constraint_name LIKE '%products%';

-- Update if needed (usually automatic)
```

### 5. Test
- Product listing pages
- Product creation
- Product editing
- Product search
- Admin panels

---

## Important Notes

1. **Always backup first** - Use Supabase backup feature
2. **Test in development** - Never rename in production without testing
3. **Coordinate with team** - Notify team members
4. **Update all environments** - Dev, staging, production
5. **Monitor after deployment** - Watch for errors

---

## Quick Commands

```bash
# Find all table references
grep -r "\.from\([\"']TABLE_NAME[\"']\)" . | wc -l

# Find in specific directory
grep -r "TABLE_NAME" components/

# Find in SQL files only
grep -r "TABLE_NAME" scripts/ --include="*.sql"

# Count total references
grep -r "TABLE_NAME" . --exclude-dir=node_modules | wc -l
```

