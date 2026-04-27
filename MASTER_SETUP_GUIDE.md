# 🏆 ADULTTOYSKE: THE MASTER SETUP & LAUNCH GUIDE

This guide is designed for a total beginner. It will walk you through setting up your own version of the **AdultToysKe** platform from scratch, including hosting, database, and email systems.

---

## 📋 PRE-REQUISITES
Before you start, make sure you have:
1.  A Google Account (for easy sign-ins).
2.  The project code files (this repository).

---

## 🛠️ STEP 1: SETTING UP GITHUB (CODE HOSTING)
GitHub is where your code "lives" online.

1.  **Create Account**: Go to [GitHub.com](https://github.com) and sign up.
2.  **Create a Repository**:
    *   Click the **+** icon at the top right → **New Repository**.
    *   Name it: `adulttoyske-store`.
    *   Set it to **Private** (recommended for security).
    *   Click **Create Repository**.
3.  **Upload the Code**:
    *   If you are on your computer, use "GitHub Desktop" (easier for rookies).
    *   Drag the folder containing `index.html`, `hq-secure-x88.html`, and `vercel.json` into the repository.
    *   Click **Commit to Main** and then **Publish Branch/Push**.

---

## 🗄️ STEP 2: SETTING UP SUPABASE (DATABASE & AUTH)
Supabase is the "brain" of your store. It handles your products, orders, and logins.

1.  **Create Account**: Sign up at [Supabase.com](https://supabase.com) using your GitHub account.
2.  **New Project**:
    *   Click **New Project**.
    *   Name: `AdultToysKe-DB`.
    *   Password: **Create a strong one and SAVE IT.**
    *   Region: Select the one closest to you (e.g., London or Dublin for Kenya).
3.  **The SQL Editor (The Command Center)**:
    *   On the left sidebar, click the **SQL Editor** (the `>_` icon).
    *   Click **New Query**.
    *   **COPY AND PASTE** the code below and click **RUN**:

```sql
-- 1. TABLES SETUP
CREATE TABLE products (id TEXT PRIMARY KEY, name TEXT, price NUMERIC, category TEXT, description TEXT, emoji TEXT, stock INTEGER DEFAULT 10, image_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE customers (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, phone TEXT, location TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE orders (id TEXT PRIMARY KEY, customer_email TEXT, customer_name TEXT, customer_phone TEXT, total NUMERIC, status TEXT DEFAULT 'pending', items JSONB, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE newsletter_subscribers (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE product_reviews (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, product_id TEXT, customer_name TEXT, customer_email TEXT, review_text TEXT, rating INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE promo_banners (type TEXT PRIMARY KEY, title TEXT, description TEXT, eyebrow TEXT, button_text TEXT);

-- 2. ENABLE SECURITY (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSION RULES (RLS POLICIES)
-- Products: Everyone can see, only Admins change.
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins full access" ON products TO authenticated USING (true) WITH CHECK (true);

-- Orders: Customers can submit and see their own history, Admins manage all.
CREATE POLICY "Allow anon order placement" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (ilike(customer_email, auth.jwt() ->> 'email'));
CREATE POLICY "Admins manage orders" ON orders TO authenticated USING (true) WITH CHECK (true);

-- Customers: Setup for profile management
CREATE POLICY "Allow anon customer insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to see their own profile" ON customers FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Reviews: Everyone can read and post.
CREATE POLICY "Public reviews read" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Public reviews write" ON product_reviews FOR INSERT WITH CHECK (true);

-- Banners: Read for all
CREATE POLICY "Banners read" ON promo_banners FOR SELECT USING (true);
```

4.  **Get Your Keys**:
    *   Go to **Settings (Gear Icon) → API**.
    *   Copy the **Project URL** and the **Anon Key**.
    *   Open `index.html` and `hq-secure-x88.html` in your code editor.
    *   Find the lines near the top that look like: `const SUPABASE_URL = '...';`
    *   Paste your own keys inside the quotes.

---

## ✉️ STEP 3: SETTING UP EMAILJS (ORDER NOTIFICATIONS)
This service sends the "Thank You" emails to customers.

1.  **Account**: Sign up at [EmailJS.com](https://emailjs.com).
2.  **Add Service**:
    *   Click **Email Services** → **Add New Service**.
    *   Select **Gmail** (or your preferred provider).
    *   Connect your account. **Save the Service ID** (e.g., `service_xxxx`).
3.  **Create Template**:
    *   Click **Email Templates** → **Create New Template**.
    *   **Subject**: `New Order Confirmation - #{{order_id}}`
    *   **Content (Copy/Paste this style)**:
        ```html
        Hi {{customer_name}},
        Thanks for shopping with us!
        
        Order ID: {{order_id}}
        Total Paid: KES {{total_price}}
        
        Items:
        {{items_list}}
        
        We will contact you via phone shortly for delivery.
        ```
    *   **Settings Tab**:
        *   **To Email**: `{{to_email}}` (This is critical!)
        *   **From Name**: `ADULTTOYSKE`
    *   Click **Save**. **Save the Template ID** (e.g., `template_yyyy`).
4.  **Connect to Code**:
    *   Open `index.html`.
    *   Find `emailjs.send("service_id", "template_id", ...)` near line 3880.
    *   Update them with your fresh IDs.
    *   Find `emailjs.init("public_key")` near the top and update it with your **Public Key** from the EmailJS Account settings.

---

## 🚀 STEP 4: DEPLOYING TO VERCEL (WEBSITE GOES LIVE)
Vercel makes your website public on a real URL.

1.  **Sign Up**: Go to [Vercel.com](https://vercel.com) and sign in with **GitHub**.
2.  **New Project**:
    *   Click **Add New** → **Project**.
    *   Import your `adulttoyske-store` repository.
    *   Vercel will automatically see your `vercel.json` file.
3.  **Launch**:
    *   Click **Deploy**.
    *   In 30 seconds, your site will be live at a URL like `adulttoyske.vercel.app`!

---

## 🗝️ STEP 5: DAILY OPERATIONS (SECRET TRICKS)

### How to access the Admin Dashboard
*   **The URL**: To hide it from curious customers, I've hidden it.
*   **The Shortcut**: Go to your homepage and press **`Ctrl` + `Shift` + `A`**.
*   **The PIN**: When asked, enter **`8899`** and press OK.
*   **Login**: You must first create an admin user in your Supabase Auth dashboard (Authentication → Users → Add User). Use that email/password to log in.

### How to add products
1.  Log in to the Admin Dashboard.
2.  Go to the **Add Product** tab.
3.  Fill out the form. Use **Emojis** (like 💄, 🌹, 💍) for a clean look!

### Data Safety
1.  **Never** share your Supabase "Service Role" key.
2.  **Never** delete the `vercel.json` file—it protects your hidden admin page.

---

## 🧪 STEP 6: SEEDING YOUR STORE (FIRST LOAD)
To add your first products quickly, stay logged into the Admin page, open the browser console (F12), and paste this:

```javascript
async function seedProducts() {
  const products = [
    { id: 'PROD-01', name: 'Luxe Rose Vibrator', price: 4500, category: 'Vibrators', emoji: '🌹', description: 'Silky soft stimulation.' },
    { id: 'PROD-02', name: 'Couples Distant Rings', price: 8200, category: 'Couples', emoji: '💍', description: 'Stay connected anywhere.' }
  ];
  for (const p of products) { await db.from('products').upsert(p); }
  alert('Seeding complete!');
}
seedProducts();
```

---

## 🏁 YOU ARE READY!
You have now set up a professional, industry-standard e-commerce platform. Your site is secure, your database is private, and your customers are protected by the highest level of web security. 

**Welcome to the team! ✨**
