import pandas as pd, glob
from collections import Counter

print("=" * 78)
print("CURRENT COVERAGE (without Batch 2)")
print("=" * 78)
all_orders = set()
for fp in sorted(glob.glob('/app/data/tdb_import/matrixify_batch*.xlsx')):
    df = pd.read_excel(fp, sheet_name='Orders')
    orders = set(df['Name'].dropna().unique())
    all_orders |= orders
    df['Created At'] = pd.to_datetime(df['Created At'], errors='coerce')
    d = df.dropna(subset=['Created At'])
    if len(d):
        dt_min = d['Created At'].min().strftime('%Y-%m-%d')
        dt_max = d['Created At'].max().strftime('%Y-%m-%d')
    else:
        dt_min = dt_max = '?'
    print(f"  {fp.split('/')[-1]:30s}  {dt_min} -> {dt_max}  ({df['Name'].dropna().nunique():,} orders)")

print(f"\nTotal unique orders captured: {len(all_orders):,}")
print(f"Doc estimate              : 42,550")
print(f"GAP                       : {42550 - len(all_orders):,} orders missing")
print(f"\nThat gap is the period 2023-03-04 to 2024-06-15.")
print(f"That's 16 months. Likely ~10,000 orders in that window.")
