import { Schema, model } from "mongoose";

export interface BookingDoc {
  booking_id: string;
  room_number: string;
  booked_by: string;
  booked_by_name: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

const bookingSchema = new Schema<BookingDoc>({
  booking_id: { type: String, required: true, unique: true },
  room_number: { type: String, required: true },
  booked_by: { type: String, required: true },
  booked_by_name: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  purpose: { type: String, required: true },
}, { versionKey: false });

bookingSchema.index({ room_number: 1, date: 1 });

export const Booking = model<BookingDoc>("Booking", bookingSchema);
