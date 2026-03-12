import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Env, AgentSession } from './types';
import { searchToursSchema, searchTours } from './tools/search-tours';
import { getAvailabilitySchema, getAvailability } from './tools/get-availability';
import { createBookingSchema, createBooking } from './tools/create-booking';
import { getBookingStatusSchema, getBookingStatus } from './tools/get-booking-status';
import { cancelBookingSchema, cancelBooking } from './tools/cancel-booking';
import { getTourCatalog } from './resources/tour-catalog';
import { costaRicaGuide } from './resources/costa-rica-guide';

export class FireCowMcpAgent extends McpAgent<Env, Record<string, unknown>, AgentSession> {
  server = new McpServer({
    name: 'FireCow Tours',
    version: '1.0.0',
  });

  async init() {
    const session = this.props;

    // ── TOOLS ────────────────────────────────────────────────────────────────

    this.server.tool(
      'search_tours',
      'Search available tours in Costa Rica with real-time availability. Returns tours with available dates and pricing including agent markup.',
      searchToursSchema.shape,
      async (input) => {
        const result = await searchTours(input, this.env, session.markup_pct, session.markup_fixed_cents);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      'get_availability',
      'Get the full availability calendar for a specific tour. Shows all open slots, pricing, and remaining capacity.',
      getAvailabilitySchema.shape,
      async (input) => {
        const result = await getAvailability(input, this.env, session.markup_pct, session.markup_fixed_cents);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      'create_booking',
      'Book a tour for a customer. Confirms instantly with deferred payment — no upfront charge. Returns booking_id for reference.',
      createBookingSchema.shape,
      async (input) => {
        const result = await createBooking(input, this.env, session);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      'get_booking_status',
      'Check the status of an existing booking by booking ID.',
      getBookingStatusSchema.shape,
      async (input) => {
        const result = await getBookingStatus(input, this.env, session);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      'cancel_booking',
      'Cancel a pending or confirmed booking. Releases the slot back into availability.',
      cancelBookingSchema.shape,
      async (input) => {
        const result = await cancelBooking(input, this.env, session);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    // ── RESOURCES ────────────────────────────────────────────────────────────

    this.server.resource(
      'tour-catalog',
      'firecow://tours/catalog',
      { mimeType: 'application/json', description: 'Complete catalog of all active FireCow tours in Costa Rica' },
      async () => {
        const catalog = await getTourCatalog(this.env);
        return { contents: [{ uri: 'firecow://tours/catalog', mimeType: 'application/json', text: catalog }] };
      }
    );

    this.server.resource(
      'costa-rica-guide',
      'firecow://destinations/costa-rica',
      { mimeType: 'text/markdown', description: 'Costa Rica travel guide: regions, seasons, transport, accommodation, tips' },
      async () => {
        return { contents: [{ uri: 'firecow://destinations/costa-rica', mimeType: 'text/markdown', text: costaRicaGuide }] };
      }
    );
  }
}
