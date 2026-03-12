import { z } from 'zod';
import type { Env, AgentSession } from '../types';

export const cancelBookingSchema = z.object({
  booking_id: z.string().describe("Booking ID to cancel"),
  reason: z.string().optional().describe("Optional cancellation reason"),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export async function cancelBooking(
  input: CancelBookingInput,
  env: Env,
  session: AgentSession
): Promise<object> {
  const booking = await env.DB
    .prepare('SELECT id, status, availability_id, party_size FROM bookings WHERE id = ? AND agent_api_key_id = ?')
    .bind(input.booking_id, session.agent_key_id)
    .first<{ id: string; status: string; availability_id: string | null; party_size: number }>();

  if (!booking) {
    return { error: 'Booking not found or does not belong to your agent account' };
  }

  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    return { error: `Cannot cancel a booking with status: ${booking.status}` };
  }

  // Release slots back
  if (booking.availability_id) {
    await env.DB
      .prepare('UPDATE tour_availability SET slots_booked = MAX(0, slots_booked - ?) WHERE id = ?')
      .bind(booking.party_size, booking.availability_id)
      .run();
  }

  const cancelNote = input.reason
    ? `Cancelled via MCP: ${input.reason}`
    : 'Cancelled via MCP';

  await env.DB
    .prepare("UPDATE bookings SET status = 'cancelled', notes = ? WHERE id = ?")
    .bind(cancelNote, input.booking_id)
    .run();

  return {
    booking_id: input.booking_id,
    status: 'cancelled',
    message: 'Booking cancelled and slot released.',
  };
}
