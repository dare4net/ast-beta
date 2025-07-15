# Waitlist & Beta API

A minimal Node.js/Express/MongoDB API for collecting waitlist, beta signup, and beta invite data.

## Endpoints

- `POST /waitlist` — `{ email }`
- `POST /beta/signup` — `{ name, email }`
- `POST /beta/invite` — `{ name, email, course, experience, goals, availability }`

## Setup

1. Copy `.env.example` to `.env` and set your MongoDB URI if needed.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```

## Example .env
```
MONGODB_URI=mongodb://localhost:27017/ast
PORT=4000
```
