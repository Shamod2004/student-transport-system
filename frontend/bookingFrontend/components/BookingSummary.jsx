import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Armchair, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";

const BookingSummary = ({ from, to, date, selectedSeats, pricePerSeat, onCheckout }) => {
  const total = selectedSeats.length * pricePerSeat;

  const formattedTotal = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(total);

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    
    await onCheckout?.();
  };

  return (
    <div className="booking-scroll-reveal overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]" data-booking-reveal>
      <div className="booking-scroll-reveal booking-delay-1 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4" data-booking-reveal>
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Your Booking</h3>
            <p className="text-sm text-slate-600">Proceed to checkout within the 10-minute seat lock</p>
          </div>
        </div>
      </div>

      <div className="booking-scroll-reveal booking-delay-2 space-y-4 p-5" data-booking-reveal>
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-800">{from} → {to}</p>
            <p className="text-xs text-slate-500">Route</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-4 w-4 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-800">{date}</p>
            <p className="text-xs text-slate-500">Travel Date</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Armchair className="mt-0.5 h-4 w-4 text-slate-500" />
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Selected Seats</h4>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {selectedSeats.length > 0 ? (
                selectedSeats.map((seat) => (
                  <span
                    key={seat}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
                  >
                    {seat}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">None selected</span>
              )}
            </div>
          </div>
        </div>

        <div className="booking-scroll-reveal booking-delay-3 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4" data-booking-reveal>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""} × LKR {pricePerSeat.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Sub Total</span>
            <span className="text-xl font-bold text-blue-700">{formattedTotal}</span>
          </div>
        </div>

        <div className="booking-scroll-reveal booking-delay-4 flex items-center gap-2 text-xs text-slate-600" data-booking-reveal>
          <Shield className="h-3.5 w-3.5" />
          <span>Your information is never shared with third parties.</span>
        </div>

        <Button
          className="booking-button w-full border border-blue-300/60 bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-500 hover:to-sky-500"
          size="lg"
          onClick={handleBooking}
          disabled={selectedSeats.length === 0}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Proceed To Checkout
        </Button>
      </div>
    </div>
  );
};

export default BookingSummary;