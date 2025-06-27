# Loading Census Data into Supabase

## Files Created
- 33 batch files (census-batch-01.sql to census-batch-33.sql)
- Each file contains 1000 records (last file: 173 records)
- Total records: 32173

## Loading Instructions

### Option 1: Load All Batches
1. Go to Supabase SQL Editor
2. Run each census-batch-XX.sql file in order
3. Each file takes about 5-10 seconds to run
4. Check progress with check-census-progress.sql

### Option 2: Test with First Batch
1. Start with census-batch-01.sql to test
2. If successful, continue with remaining batches
3. You can stop at any time and resume later

### Option 3: If RLS Blocks Loading
1. Go to Table Editor → population_mesh
2. Click on the table → Policies tab
3. Temporarily toggle OFF "Enable RLS"
4. Run the batch files
5. Re-enable RLS after loading

## Troubleshooting
- If a batch fails, check the error message
- You can re-run any batch safely (uses ON CONFLICT)
- Each batch is independent

## Verify Success
After loading, run check-census-progress.sql to see:
- Total records loaded
- Population statistics
- Geographic coverage
