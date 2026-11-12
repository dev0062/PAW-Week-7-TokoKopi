/**
 * ============================================================================
 * FILE: routes/chat.routes.js
 * ============================================================================
 * FUNGSI:
 * Mendefinisikan endpoint routing khusus untuk fitur AI Assistant (`POST /api/chat`)
 * yang menghubungkan middleware validasi (`validateChatInput`) dengan controller
 * (`chat.controller.js`).
 *
 * REFERENSI MODUL PRAKTIKUM:
 * - Bagian 4 (Implementasi Backend API untuk AI Assistant):
 *   Endpoint `POST /api/chat` menerima pertanyaan pengguna, memproses context
 *   aplikasi, dan mengembalikan respons dari Google Gemini.
 * - Bagian 6 (Struktur dan Pengelolaan Project):
 *   Memisahkan routing fitur AI Assistant ke dalam `routes/chat.routes.js`.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const validateChatInput = require('../middlewares/validateChatInput');
const chatController = require('../controllers/chat.controller');

// Endpoint utama AI Assistant: POST /api/chat
// Alur: Request -> Middleware Validasi & Guardrail -> Chat Controller -> Gemini Service -> Response
router.post('/api/chat', validateChatInput, chatController.handleChatRequest);

module.exports = router;
