GLOBAL SNACK WEBSITE V1
=======================

This is a static catalogue website for Global Snack.
- No prices, checkout, or stock/availability display.
- Product search, category/brand filters.
- Enquiry cart with quantities.
- Retail/wholesale enquiry type.
- One combined WhatsApp message.
- Responsive chocolate-brown and cream design.

IMPORTANT: YOUR MASTER CSV CONTAINS 120 CANDIDATE RECORDS:
- 100 CocoCart
- 20 Aliz Foods
All 120 records have approval_status=needs_review and active=no.
The live website therefore hides them until you approve them. This is intentional.
Do not publish supplier product data/images until reuse rights cover your intended use.

HOW TO APPROVE PRODUCTS
1. Open data/products.csv in Excel.
2. Review product name, brand, description, source URL and image URL.
3. For each product approved for public display, change the active column from no to yes.
4. Save as CSV UTF-8 (comma delimited), keeping the same headers.
5. Run the included build_catalogue.py using Python:
   py build_catalogue.py
6. This updates data/products.json from products.csv.
7. Upload the whole website folder to your hosting.

IMAGE NOTES
The current master CSV has source_image_url values but no local_image_path values.
The site uses the source image URL directly. This requires the source host to allow image embedding and for your permission to cover reuse/rehosting as applicable. For long-term reliability, download authorised image files and host them in your own images folder, then set image URLs to those local paths.

WHATSAPP
The current number in app.js is 917990683272 (+91 7990683272).
Change WHATSAPP_NUMBER if you want another enquiry number.

LOCAL PREVIEW
Do not open index.html by double-click if fetch is blocked. Open a terminal in this folder and run:
  py -m http.server 8000
Then visit:
  http://localhost:8000

HOSTING
Upload the contents of this folder to a GitHub repository root and connect it to Cloudflare Pages. Build command: none. Output directory: / (repository root). Or use another static host.
