import { z } from 'zod';
import type { Env, AgentSession } from '../types';

export const getBookingStatusSchema = z.object({
  booking_id: z.string().describe("Booking ID returned from create_booking"),
});

export type GetBookingStatusInput = z.infer<typeof getBookingStatusSchema>;

export async function getBookingStatus(
  input: GetBookingStatusInput,
  env: Env,
  session: AgentSession
): Promise<object> {
  const booking = await env.DB
    .prepare(`
      SELECT b.id, b.status, b.booking_date, b.party_size,
             b.total_amount, b.customer_name, b.customer_email,
             b.notes, b.created_at, b.payment_deferred,
             t.name as tour_name,
             a.date as slot_date, a.time_slot
      FROM bookings b
      JOIN tours t ON t.id = b.tour_id
      LEFT JOIN tour_availability a ON a.id = b.availability_id
      WHERE b.id = ? AND b.agent_api_key_id = ?
    `)
    .bind(input.booking_id, session.agent_key_id)
    .first<{
      id: string; status: string; booking_date: string; party_size: number;
      total_amount: number; customer_name: string; customer_email: string;
      notes: string | null; created_at: string; payment_deferred: number;
      tour_name: string; slot_date: string | null; time_slot: string | null;
    }>();

  if (!booking) {
    return { error: 'Booking not found or does not belong to your agent account' };
  }

  return {
    booking_id: booking.id,
    status: booking.status,
    tour_name: booking.tour_name,
    date: booking.slot_date ?? booking.booking_date,
    time_slot: booking.time_slot,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    party_size: booking.party_size,
    total_amount_display: `$${Math.round(booking.total_amount / 100)}`,
    payment_deferred: booking.payment_deferred === 1,
    notes: booking.notes,
    created_at: booking.created_at,
  };
}
