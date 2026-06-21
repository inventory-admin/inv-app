-- Re-pad existing item tags from SCHOOLID/N/category to SCHOOLID/NNN/category
-- This updates tags like "GPS6/1/ups" to "GPS6/001/ups" for correct sort order.
-- Only applies to tags matching the pattern SOMETHING/DIGITS/SOMETHING.

UPDATE "Inventory"
SET "itemTag" = 
  SUBSTRING("itemTag" FROM '^([^/]+)/')
  || LPAD(
    SUBSTRING("itemTag" FROM '^[^/]+/([0-9]+)/'),
    3, '0'
  )
  || '/'
  || SUBSTRING("itemTag" FROM '^[^/]+/[0-9]+/(.+)$')
WHERE "itemTag" ~ '^[^/]+/[0-9]+/[^/]+$';
