# Vape Finder

A production-ready Node.js + Express directory app for finding vape shops, product types, and store websites. It includes a real JSON-backed store list, a stronger storefront UI, distance-based search, and cPanel-ready startup instructions.

## Features

- Search by city, state, ZIP, product, or store name
- Use browser geolocation for nearby store discovery
- Filter by distance radius and delivery availability
- Sort nearby stores by proximity
- View store rating, products, website, and phone number
- Uses a JSON data source for a cleaner real-world setup

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Data source

The app reads store records from:

```text
data/stores.json
```

You can add or edit real store entries there.

## cPanel deployment

1. Upload this entire project folder to your cPanel account, for example:
   ```text
   public_html/vapefinder
   ```
2. In cPanel, open Node.js App.
3. Create a new application.
4. Set the app root to the uploaded folder.
5. Set the startup file to:
   ```text
   server.js
   ```
6. If you prefer a custom startup flow, run:
   ```bash
   bash ./cpanel-start.sh
   ```
7. Save and start the app.

## Important notes

- This app is ready for a cPanel Node.js environment.
- It assumes a standard Node.js runtime with Express installed.
- For production, replace the sample store list in the JSON file with your actual retail listings or connect it to a database or API.
