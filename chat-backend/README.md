# Chat Backend (Express + MongoDB + Socket.IO)

## Setup
1. Copy `.env.example` to `.env` and update values.
2. `npm install`
3. `npm run dev` (requires nodemon) or `npm start`

## Features
- Signup / Login / Logout / Refresh token
- Update user profile (name, phone, password)
- Friends: add / list
- Groups: create / list / add-member / remove-member / promote-admin / update (admins only) / delete (owner only)
- Socket.IO for real-time messages (events: join_room, send_message)
