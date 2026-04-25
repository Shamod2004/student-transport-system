import { Clock, Bus, Route, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookingCard = ({
  departureCity,
  arrivalCity,
  departureDateTime,
  arrivalDateTime,
  duration,
  busType,
  busModel,
  routeNumber,
  availableSeats,
  priceLkr,
  seatSelectorTheme = "default",
  onSelectSeats,
}) => {
  const isLowSeats = availableSeats < 10;
  const formattedPrice = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(priceLkr || 0);

  return (
    <div className="booking-scroll-reveal overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]" data-booking-reveal>
      {/* Route Header */}
      <div className="booking-scroll-reveal booking-delay-1 p-6 pb-4" data-booking-reveal>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Departure
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-800">{departureCity}</h3>
            <p className="mt-0.5 text-sm text-slate-600">{departureDateTime}</p>
          </div>

          <div className="flex flex-col items-center gap-1 px-4">
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-slate-300" />
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
              <div className="h-px w-8 bg-slate-300" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </div>

          <div className="flex-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Arrival
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-800">{arrivalCity}</h3>
            <p className="mt-0.5 text-sm text-slate-600">{arrivalDateTime}</p>
          </div>
        </div>
      </div>

      {/* Bus Details */}
      <div className="booking-scroll-reveal booking-delay-2 grid grid-cols-2 gap-px border-y border-slate-200 bg-slate-100 sm:grid-cols-4" data-booking-reveal>
        {[
          { label: "Bus Type", value: busType, icon: Bus },
          { label: "Bus Model", value: busModel, icon: Bus },
          { label: "Route Number", value: routeNumber, icon: Route },
          {
            label: "Available Seats",
            value: String(availableSeats),
            icon: Users,
            highlight: isLowSeats,
          },
        ].map((item) => (
          <div key={item.label} className="bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            <p
              className={`mt-1 text-sm font-bold ${
                item.highlight ? "text-rose-600" : "text-slate-800"
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Price & CTA */}
      <div className="booking-scroll-reveal booking-delay-3 flex items-center justify-between p-6 pt-4" data-booking-reveal>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Ticket Price
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{formattedPrice}</p>
        </div>
        <Button
          size="lg"
          className={
            seatSelectorTheme === "female"
              ? "booking-button border border-pink-300/60 bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:from-pink-500 hover:to-rose-500"
              : "booking-button border border-blue-300/60 bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-500 hover:to-sky-500"
          }
          onClick={onSelectSeats}
        >
          Select Seats
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BookingCard;