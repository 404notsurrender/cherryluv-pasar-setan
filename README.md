# CherryLuvv Market: Pasar Setan

Build a modern e-commerce website called "CherryLuvv Market" for selling in-game items from the Roblox game "Pasar Setan".

IMPORTANT:
This is NOT a generic Roblox marketplace. The website should specifically focus on selling Pasar Setan game items.

BRAND:
- Brand name: CherryLuvv Market
- Marketplace: Pasar Setan Roblox
- Main tagline: "Item Pasar Setan, Cepat & Aman."
- Visual identity: cute kawaii gaming marketplace
- Color palette: pastel pink, lavender, white, with dark purple accents
- Style: modern, premium, cute, clean, slightly playful
- Use cherries, stars, hearts, subtle sparkles and gaming-related decorative elements
- Avoid making the website look like a copy of an existing marketplace
- Create an original visual identity for CherryLuvv Market

PRODUCT CATEGORIES:

1. KOIN
   - Pasar Setan Coins
   - Product should have multiple quantity/package options
   - Example packages:
     - 10K Koin
     - 25K Koin
     - 50K Koin
     - 100K Koin
     - Custom Amount

2. SULTAN BETINA & JANTAN
   - Sultan Betina
   - Sultan Jantan
   - Each should be a separate product
   - Allow customers to select quantity

3. SERPIHAN ARWAH
   - Spirit Shards / Serpihan Arwah
   - Multiple quantity packages

4. MATENGAN
   Products:
   - Sate Kepiting
   - Pisang Rebus
   - Sate Gagak
   - Jamur Rebus
   Each must be displayed as a separate product.

5. DUPA
   - Dupa
   - Multiple quantity options

6. KEPITING SUNGAI
   - Kepiting Sungai
   - Multiple quantity options

WEBSITE STRUCTURE:

Homepage:
- Hero section with "CherryLuvv Market"
- Subtitle: "Jual Item Pasar Setan Roblox"
- CTA buttons:
  - "Belanja Sekarang"
  - "Lihat Semua Item"
- Feature cards:
  - Proses Cepat
  - Harga Bersahabat
  - Pelayanan Ramah
  - Transaksi Aman
- Featured products
- Product categories
- How to order section
- Customer reviews/testimonials
- FAQ
- Footer

SHOP PAGE:
Create a complete product catalog.

Features:
- Search products
- Category filter
- Sort by price
- Sort by popularity
- Product cards
- Product image
- Product name
- Price
- Stock status
- Quantity selector
- "Tambah ke Keranjang"
- "Beli Sekarang"

CATEGORY FILTERS:
- Semua
- Koin
- Sultan
- Serpihan Arwah
- Matengan
- Dupa
- Kepiting Sungai

PRODUCT DETAIL PAGE:
Each product should have:
- Product image
- Product name
- Description
- Price
- Available quantity/package
- Stock status
- Quantity selector
- Add to cart
- Buy now
- Estimated delivery/process time
- Important instructions

CART:
Create a shopping cart system.

Cart should display:
- Product
- Quantity
- Price
- Subtotal
- Remove item
- Total price
- Checkout button

CHECKOUT:
Create a clean checkout page.

Fields:
- Roblox Username
- Roblox Display Name
- Discord Username (optional)
- WhatsApp number
- Order notes
- Payment method

Before submitting the order, show:
- Order summary
- Product list
- Total price
- Customer Roblox username
- Payment method

ORDER SYSTEM:
After checkout, create an order number such as:
CLM-20260927-0001

Show an order confirmation page with:
- Order number
- Payment status
- Order status
- Purchased items
- Roblox username
- Total payment
- Instructions for the customer

ORDER STATUS:
- Pending Payment
- Payment Confirmed
- Processing
- Completed
- Cancelled

CUSTOMER ORDER TRACKING:
Create an "Cek Pesanan" page.

Customer enters:
- Order ID
- WhatsApp number or Roblox username

Then show the order status and order details.

ADMIN DASHBOARD:
Create a protected admin dashboard.

Admin features:
- Dashboard overview
- Total orders
- Pending orders
- Completed orders
- Revenue
- Product management
- Add product
- Edit product
- Delete product
- Stock management
- Order management
- Update order status
- Customer information
- Payment status
- Order notes

PRODUCT DATABASE:
Use a database structure that supports:
- products
- categories
- product_variants
- orders
- order_items
- customers
- payments
- admin_users

Each product should support:
- id
- name
- slug
- category
- description
- image
- price
- stock
- status
- created_at

SECURITY:
Implement proper authentication and authorization.

Important:
- Customers must NOT have access to admin functions.
- Admin routes must be protected.
- Never expose admin credentials in frontend code.
- Validate all checkout inputs.
- Sanitize user input.
- Prevent duplicate orders.
- Use server-side validation for important operations.
- Do not trust price values sent by the frontend.
- Calculate final prices on the server/database side.
- Do not expose sensitive payment information.

RESPONSIVE DESIGN:
The website must be fully responsive:
- Desktop
- Laptop
- Tablet
- Mobile

Mobile navigation should use a clean hamburger menu.

UI DETAILS:
Use:
- Rounded cards
- Soft shadows
- Glassmorphism used sparingly
- Pastel pink/lavender gradients
- Dark purple typography
- Cherry-themed decorative elements
- Cute but professional product illustrations
- Smooth hover animations
- Micro-interactions
- Loading states
- Empty states
- Toast notifications

IMPORTANT UX:
The website should feel like a real Indonesian gaming marketplace, not a template.

Use Indonesian language throughout the customer-facing website.

Example CTA:
"Belanja Sekarang"
"Tambah ke Keranjang"
"Beli Sekarang"
"Cek Pesanan"
"Hubungi Admin"

Create realistic placeholder product data for all Pasar Setan products listed above.

Do NOT add unrelated Roblox games or unrelated products.

Make the homepage visually impressive and conversion-focused while keeping the interface clean and easy to navigate.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cherryluv-pasar-setan.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1a889854-5490-4ca9-8c75-a44b072fd1d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
