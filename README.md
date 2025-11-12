# تطبيق محادثات فورية (Frontend + Backend)

تطبيق محادثات فورية يدعم المحادثات المباشرة والمجموعات، مبني على واجهة React (TypeScript + Vite + Tailwind) وخادم Node.js/Express مع Socket.IO للتواصل الفوري، ومصادقة JWT.

## فكرة المشروع

- يوفّر واجهة واضحة وسريعة لإدارة المحادثات والأصدقاء.
- يعتمد على Socket.IO لتحديث الرسائل والمحادثات لحظياً بدون إعادة تحميل الصفحة.
- يدعم محادثات فردية ومحادثات جماعية مع نقل آخر محادثات للواجهة تلقائياً.
- مصادقة المستخدمين عبر JWT، مع تخزين آمن لبيانات المستخدم في `localStorage` واستخدام كوكيز للوصول للـ API.

## المزايا الرئيسية

- رسائل فورية عبر Socket.IO.
- محادثات مباشرة ومجموعات مع آخر رسالة.
- واجهة متجاوبة تعمل بشكل جيد على الشاشات الصغيرة والكبيرة.
- نظام أصدقاء مع إضافة/حذف وتحديث فوري عبر Socket.IO.
- فصل طبقات التطبيق: واجهة أمامية مستقلة وخادم مستقل.

## التقنيات المستخدمة

- الواجهة: `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `react-router-dom`, `axios`.
- الخلفية: `Node.js`, `Express`, `MongoDB` (نماذج جاهزة في مجلد `chat-backend/models`)، `Socket.IO`, `JWT`.

## الهيكل العام للمشروع

```
chat-app/
├── src/                    # واجهة المستخدم (React + TS)
│   ├── Components/         # مكونات الواجهة (Aside/Chat/...)
│   ├── context/            # مزوّدات السياق (Auth/Socket)
│   ├── Pages/              # صفحات (Login/Register)
│   ├── Layouts/            # قوالب العرض (ChatLayout)
│   ├── utils/              # خدمات وملفات مساعدة (API/authService)
│   └── main.tsx            # نقطة الدخول للواجهة
├── chat-backend/           # الخادم (Express + Socket.IO)
│   ├── routes/             # المسارات (auth/chat/friends/groups)
│   ├── sockets/            # Socket.IO
│   ├── models/             # نماذج Mongoose
│   └── server.js           # تشغيل الخادم
└── README.md               # هذا الملف
```

## المتطلبات

- Node.js 18+.
- MongoDB متاح (محلياً أو سحابيًا).

## الإعداد والتشغيل

1) تثبيت الحزم

```bash
# الواجهة الأمامية (frontend)
cd chat-app
npm install

# الخادم (backend)
cd chat-backend
npm install
```

2) تهيئة ملف البيئة للخادم `chat-backend/.env`

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=replace_with_strong_secret
CLIENT_URL=http://localhost:5173
```

3) تشغيل الخادم والواجهة

```bash
# في مجلد chat-backend
npm run dev

# في مجلد chat-app
npm run dev
```

الواجهة تعمل افتراضياً على `http://localhost:5173/` والخادم على `http://localhost:8080/`.

## نقاط التكامل (مختصر)

- REST API أساسيات:
  - `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`
  - `GET /api/friends`, `POST /api/friends/add`, `DELETE /api/friends/remove/:id`
  - `GET /api/chat/list/all`, `GET /api/chat/:chatId?type=direct|group`, `POST /api/chat/send`
- Socket.IO أحداث رئيسية:
  - `receive_message`, `new_message_notification`, `friend_added`, `friend_removed`

## ملاحظات الأداء

- استخدام `React.memo`, `useMemo`, و`useCallback` لتقليل إعادة الرندر غير الضرورية.
- تحديث ذكي لقائمة المحادثات بدون إعادة تحميل كامل البيانات عند وصول رسالة جديدة.

## المساهمة

يسعدنا استقبال المساهمات. افتح Issue أو Pull Request لأي تحسين أو إصلاح.

## الترخيص

MIT – راجع ملف `LICENSE`.

---

# Real-time Chat App (Frontend + Backend)

A real-time chat application supporting direct and group chats. Frontend built with React + TypeScript + Vite + Tailwind; Backend built with Node.js/Express and Socket.IO; JWT-based authentication.

## Highlights

- Real-time messaging via Socket.IO.
- Direct and group chats with latest message on top.
- Responsive UI optimized for mobile and desktop.
- Friends system (add/remove) with instant updates.
- Clean separation between frontend and backend.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, react-router-dom, axios
- Backend: Node.js, Express, MongoDB, Socket.IO, JWT

## Setup

```bash
# Frontend
cd chat-app && npm install && npm run dev

# Backend
cd chat-backend && npm install && npm run dev
```

Backend runs on `http://localhost:8080/` and frontend on `http://localhost:5173/`.

## API & Sockets (brief)

- REST: auth (login/register/logout/me), friends (list/add/remove), chat (list, messages, send)
- Socket.IO: receive_message, new_message_notification, friend_added, friend_removed

## Contributing

Pull Requests are welcome.

## License

MIT