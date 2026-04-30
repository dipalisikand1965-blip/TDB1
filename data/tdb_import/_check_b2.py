import pandas as pd
df = pd.read_excel('/app/data/tdb_import/matrixify_batch2.xlsx', sheet_name='Orders')
out = [f"shape: {df.shape}"]
if len(df):
    df['Created At'] = pd.to_datetime(df['Created At'], errors='coerce')
    d = df.dropna(subset=['Created At'])
    if len(d):
        out.append(f"date range: {d['Created At'].min()} -> {d['Created At'].max()}")
    out.append(f"unique orders: {df['Name'].dropna().nunique()}")
with open('/tmp/_b2.txt', 'w') as f:
    f.write('\n'.join(out))
