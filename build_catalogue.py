import pandas as pd, json
from pathlib import Path
root=Path(__file__).parent
df=pd.read_csv(root/'data'/'products.csv').fillna('')
records=[]
for i,r in df.iterrows():
    records.append({
      'id':str(i+1),'name':str(r.get('product_name','')).strip(),
      'brand':str(r.get('brand','')).strip(),'description':str(r.get('description','')).strip(),
      'image':str(r.get('source_image_url','')).strip(),'source':str(r.get('source_name','')).strip(),
      'sourceUrl':str(r.get('source_url','')).strip(),'variant':str(r.get('variant_pack_size','')).strip(),
      'gtin':str(r.get('barcode_gtin','')).strip(),
      'category':str(r.get('category','')).strip() or 'Imported Snacks',
      'active':str(r.get('active','no')).strip().lower() in ('yes','true','1'),
      'approval':str(r.get('approval_status','needs_review')).strip()
    })
(root/'data'/'products.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Built catalogue: {sum(x["active"] for x in records)} active of {len(records)} records')
