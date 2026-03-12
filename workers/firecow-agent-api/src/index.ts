/**
 * FireCow Agent API — Cloudflare Worker
 * Agent-facing REST API for AI agents to search and book tours.
 *
 * Agent endpoints (require: Authorization: Bearer <api-key>):
 *   GET  /health
 *   GET  /agent/tours                   — search tours with availability
 *   GET  /agent/tours/:id/availability  — full availability calendar
 *   POST /agent/bookings                — create deferred-payment booking
 *   GET  /agent/bookings                — list agent's bookings
 *   GET  /agent/bookings/:id            — get single booking
 *   DELETE /agent/bookings/:id          — cancel booking
 *
 * Admin endpoints (require: Authorization: Bearer <ADMIN_KEY>):
 *   GET    /admin/api-keys              — list all agent API keys
 *   POST   /admin/api-keys              — generate new agent API key
 *   PUT    /admin/api-keys/:id          — update key (markup, active status)
 *   DELETE /admin/api-keys/:id          — deactivate API key
 *   GET    /admin/availability          — list availability (?tour_id=&month=YYYY-MM)
 *   POST   /admin/availability/bulk     — upsert availability rows
 *   PUT    /admin/availability/:id      — update single availability row
 */

import type { Env } from './types';
import { CORS, json, err } from './utils';
import { authenticateAgent, authenticateAdmin } from './auth';
import { handleGetTours, handleGetTourAvailability } from './tours';
import { handleCreateBooking, handleGetBooking, handleListBookings, handleCancelBooking } from './bookings';
import {
  handleListAvailability,
  handleBulkUpsertAvailability,
  handleUpdateAvailability,
  handleListAgentKeys,
  handleGenerateApiKey,
  handleUpdateAgentKey,
  handleDeleteApiKey,
} from './availability';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Health check — public
    if (method === 'GET' && path === '/health') {
      return json({ status: 'ok', service: 'firecow-agent-api' });
    }

    // ── AGENT ROUTES ─────────────────────────────────────────────────────────
    if (path.startsWith('/agent/')) {
      const auth = await authenticateAgent(request, env);
      if (!auth.ok) return auth.response;
      const { agent } = auth;

      // GET /agent/tours
      if (method === 'GET' && path === '/agent/tours') {
        return handleGetTours(url, env, agent);
      }

      // GET /agent/tours/:id/availability
      const tourAvailMatch = path.match(/^\/agent\/tours\/([^/]+)\/availability$/);
      if (method === 'GET' && tourAvailMatch) {
        return handleGetTourAvailability(tourAvailMatch[1], url, env, agent);
      }

      // POST /agent/bookings
      if (method === 'POST' && path === '/agent/bookings') {
        return handleCreateBooking(request, env, agent);
      }

      // GET /agent/bookings
      if (method === 'GET' && path === '/agent/bookings') {
        return handleListBookings(url, env, agent);
      }

      // GET /agent/bookings/:id  |  DELETE /agent/bookings/:id
      const bookingMatch = path.match(/^\/agent\/bookings\/([^/]+)$/);
      if (bookingMatch) {
        if (method === 'GET') return handleGetBooking(bookingMatch[1], env, agent);
        if (method === 'DELETE') return handleCancelBooking(bookingMatch[1], env, agent);
      }

      return err('Not found', 404);
    }

    // ── ADMIN ROUTES ─────────────────────────────────────────────────────────
    if (path.startsWith('/admin/')) {
      if (!authenticateAdmin(request, env)) {
        return err('Unauthorized', 401);
      }

      // GET /admin/api-keys
      if (method === 'GET' && path === '/admin/api-keys') {
        return handleListAgentKeys(env);
      }

      // POST /admin/api-keys
      if (method === 'POST' && path === '/admin/api-keys') {
        return handleGenerateApiKey(request, env);
      }

      // PUT /admin/api-keys/:id  |  DELETE /admin/api-keys/:id
      const keyMatch = path.match(/^\/admin\/api-keys\/([^/]+)$/);
      if (keyMatch) {
        if (method === 'PUT') return handleUpdateAgentKey(keyMatch[1], request, env);
        if (method === 'DELETE') return handleDeleteApiKey(keyMatch[1], env);
      }

      // GET /admin/availability
      if (method === 'GET' && path === '/admin/availability') {
        return handleListAvailability(url, env);
      }

      // POST /admin/availability/bulk
      if (method === 'POST' && path === '/admin/availability/bulk') {
        return handleBulkUpsertAvailability(request, env);
      }

      // PUT /admin/availability/:id
      const availMatch = path.match(/^\/admin\/availability\/([^/]+)$/);
      if (method === 'PUT' && availMatch) {
        return handleUpdateAvailability(availMatch[1], request, env);
      }

      return err('Not found', 404);
    }

    return err('Not found', 404);
  },
};
