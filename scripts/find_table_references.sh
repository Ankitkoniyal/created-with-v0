#!/bin/bash
# Script to find all references to a database table in the codebase
# Usage: ./find_table_references.sh TABLE_NAME

if [ -z "$1" ]; then
    echo "Usage: ./find_table_references.sh TABLE_NAME"
    echo "Example: ./find_table_references.sh products"
    exit 1
fi

TABLE_NAME="$1"

echo "=========================================="
echo "Searching for references to table: $TABLE_NAME"
echo "=========================================="
echo ""

echo "1. TypeScript/JavaScript files (.from() calls):"
echo "-------------------------------------------"
grep -rn "\.from\([\"']${TABLE_NAME}[\"']\)" . \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    | head -50

echo ""
echo "2. SQL files:"
echo "-------------------------------------------"
grep -rn "${TABLE_NAME}" scripts/ \
    --include="*.sql" \
    | head -20

echo ""
echo "3. Documentation files:"
echo "-------------------------------------------"
grep -rn "${TABLE_NAME}" docs/ \
    --include="*.md" \
    | head -20

echo ""
echo "4. Count of references:"
echo "-------------------------------------------"
TS_COUNT=$(grep -r "\.from\([\"']${TABLE_NAME}[\"']\)" . \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    | wc -l)

SQL_COUNT=$(grep -r "${TABLE_NAME}" scripts/ \
    --include="*.sql" \
    | wc -l)

echo "TypeScript/JavaScript references: $TS_COUNT"
echo "SQL script references: $SQL_COUNT"
echo "Total references: $((TS_COUNT + SQL_COUNT))"

echo ""
echo "=========================================="
echo "Search complete!"
echo "=========================================="

