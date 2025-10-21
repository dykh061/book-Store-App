# Book Store App

A modular Node.js + Express + Handlebars web application for managing and browsing products (books and stationery). This project is a demo/bookstore prototype that supports server-side rendering, RESTful APIs, and AJAX-powered pagination.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Views & Frontend Behavior](#views--frontend-behavior)
- [Pagination (AJAX)](#pagination-ajax)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Product management for multiple product types (Books, Stationery) using a factory pattern.
- Server-side rendered pages (Handlebars) for public views and admin actions.
- RESTful API endpoints for product CRUD operations.
- AJAX-based pagination for smooth page transitions without full reloads.
- User/session support hooks (cookie parsing, authentication helpers prepared).
- Modular controllers, services, and Mongoose models.

## Tech Stack

- Node.js (v18+ recommended)
- Express
- Handlebars (express-handlebars)
- MongoDB (Mongoose)
- Bootstrap 5 + MDB UI Kit for styling
- Optional: nodemon for development, Sass for styles

## Project Structure

Key folders and files:

- `src/server.mjs` - Main app bootstrap and view engine setup.
- `src/routes` - Express routers (view routers and API routers).
- `src/controllers` - Route handlers (page controllers, product controllers, etc.).
- `src/services` - Business logic and factory for product creation.
- `src/models` - Mongoose models (`product.model.mjs`, `book`, `stationery`).
- `src/resources/views` - Handlebars templates (layouts, partials, pages).
- `src/public` - Static assets (CSS, JS, images).

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd book-Store-App
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment & MongoDB:

- The project expects a local MongoDB instance by default. Update `src/configs/configs.mongodb.mjs` if needed.

4. (Optional) Install dev tools:

```bash
npm install -D nodemon
```

## Running the App

Start the app in development:

```bash
npm run dev
```

Or run directly:

```bash
node src/server.mjs
```

Server will start on port defined in `src/configs/configs.mongodb.mjs` (default: 3000).

## API Endpoints

API routers are located in `src/routes/product.api.Router`. Example endpoints (prefix `/v1/api`):

- `GET /v1/api/products` - list products (supports `page`, `limit`, `sort`, `order`, filters)
- `GET /v1/api/products/:id` - get product details
- `POST /v1/api/products` - create product (product-type-specific)
- `PUT /v1/api/products/:id` - update product
- `DELETE /v1/api/products/:id` - delete product

Refer to router files for full route definitions.

## Views & Frontend Behavior

- Views use Handlebars templates under `src/resources/views` and a `main.hbs` layout.
- Partials include header, nav, and footer.
- Frontend AJAX logic for products is in `src/public/js/product.mjs` which calls the API to fetch paginated data and updates the DOM without a full reload.

## Pagination (AJAX)

Pagination is implemented with server-side pagination (Mongoose `limit` + `skip`) and an AJAX client that:

- Fetches `/v1/api/products?page=N&limit=M` and receives `{ products, currentPage, totalPages }`.
- Renders product cards into `#product-list` and page links into `#pagination`.
- Uses `fetch()` and event delegation to handle clicks on pagination links.

If you want a compact "..." style paginator (e.g., `1 2 3 ... 50`), the controller builds a `pagesArr` and passes it into the view.

## Development Notes

- Handlebars helpers: `handlebars-helpers` is installed to provide helpers like `eq`, `add`, `subtract`. If you prefer, you can register custom helpers in `src/server.mjs`.
- Services: `src/services/product.service.mjs` uses a factory pattern to register product types and encapsulate DB logic.
- Error handling: centralized error middleware in `src/server.mjs` returns JSON for API paths and renders auth forms properly for certain routes.

## Troubleshooting

- `npm` commands blocked in PowerShell: run in CMD or set execution policy: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.
- Missing handlebars helper errors: either register helpers in `server.mjs` or build necessary arrays (like pages) in controllers and avoid helper reliance.
- If `console.log` prints `[object Object]`, use `console.log(JSON.stringify(obj, null, 2))` to inspect.

## Contributing

Contributions welcome. Please open issues or PRs. Follow repository code style and add tests for any new services/controllers.

## License

This project is provided as-is for learning/demo purposes. Add your preferred license if you plan to publish.
