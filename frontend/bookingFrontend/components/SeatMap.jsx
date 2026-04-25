import { cn } from "@/lib/utils";

const SeatButton = ({ seat, onClick, theme = "default", isFlagged = false, seatChangeMode = false }) => {
  const isFemaleTheme = theme === "female";
  const isAvailable = seat.status === "available";
  const isSelected = seat.status === "selected";
  const isBooked = seat.status === "booked" || seat.status === "booked-male" || seat.status === "booked-female";
  const isReserved = seat.status === "reserved";

  return (
    <button
      onClick={onClick}
      disabled={isBooked || isReserved}
      className={cn(
        "relative h-12 w-12 rounded-xl text-xs font-bold transition-[transform,box-shadow,border-color,background-color,color] duration-200 flex flex-col items-center justify-center gap-0.5",
        isAvailable &&
          (isFemaleTheme
            ? "border-2 border-border bg-card text-foreground hover:border-pink-500 hover:shadow-md hover:scale-110 cursor-pointer"
            : "border-2 border-border bg-card text-foreground hover:border-primary hover:shadow-md hover:scale-110 cursor-pointer"),
        isSelected &&
          (isFemaleTheme
            ? "border-2 border-pink-500 bg-pink-500 text-white shadow-lg scale-110 cursor-pointer ring-2 ring-pink-400/40 ring-offset-2 ring-offset-background"
            : "border-2 border-primary bg-primary text-primary-foreground shadow-lg scale-110 cursor-pointer ring-2 ring-primary/30 ring-offset-2 ring-offset-background"),
        seat.status === "booked-male" &&
          "border-2 border-blue-400/30 bg-blue-500/15 text-blue-400 cursor-not-allowed",
        seat.status === "booked-female" &&
          "border-2 border-pink-400/30 bg-pink-500/15 text-pink-400 cursor-not-allowed",
        seat.status === "booked" &&
          "border-2 border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed",
        isReserved &&
          "border-2 border-accent bg-accent/20 text-accent-foreground cursor-not-allowed",
        isFlagged && seatChangeMode &&
          "ring-2 ring-offset-2 ring-offset-background ring-amber-400 border-amber-400/70"
      )}
      title={
        isFlagged && seatChangeMode
          ? "Flagged seat to replace"
          : isBooked
          ? "Already booked"
          : isReserved
          ? "Reserved"
          : isSelected
          ? "Click to deselect"
          : `Seat ${seat.id}`
      }
    >
      <span className="text-[11px] leading-none font-bold">{seat.id}</span>
      {isFlagged && seatChangeMode ? (
        <span className="text-[8px] leading-none font-semibold uppercase text-amber-400">Flag</span>
      ) : null}
      {/* Seat bottom indicator */}
      <div
        className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full",
          isAvailable && "bg-border",
          isSelected && (isFemaleTheme ? "bg-white/70" : "bg-primary-foreground/60"),
          seat.status === "booked-male" && "bg-blue-400/40",
          seat.status === "booked-female" && "bg-pink-400/40",
          seat.status === "booked" && "bg-muted-foreground/20",
          isReserved && "bg-accent/40"
        )}
      />
    </button>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={cn("h-4 w-4 rounded-md border", color)} />
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

const SeatMap = ({ seats, onSeatClick, theme = "default", flaggedSeatId = "", seatChangeMode = false }) => {
  const isFemaleTheme = theme === "female";
  const selectedCount = seats.filter((s) => s.status === "selected").length;
  const availableCount = seats.filter((s) => s.status === "available").length;

  // Group seats into rows
  const rows = [];
  seats.forEach((seat) => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row][seat.col] = seat;
  });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {availableCount} available · {selectedCount} selected
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LegendItem color="border-border bg-card" label="Available" />
        <LegendItem color={isFemaleTheme ? "border-pink-500 bg-pink-500" : "border-primary bg-primary"} label="Selected by You" />
        <LegendItem color="border-blue-400/30 bg-blue-500/15" label="Booked (Gents)" />
        <LegendItem color="border-pink-400/30 bg-pink-500/15" label="Booked (Ladies)" />
        {seatChangeMode ? <LegendItem color="border-amber-400/70 bg-amber-500/20" label="Flagged Seat" /> : null}
        <LegendItem color="border-accent bg-accent/20" label="Reserved" />
      </div>

      {/* Bus Shape */}
      <div className="mx-auto max-w-sm">
        {/* Front of bus */}
        <div className="relative mb-3">
          <div className="flex items-center justify-between rounded-t-[2rem] border-2 border-border bg-muted/30 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Front
            </span>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full border-2 border-border bg-muted flex items-center justify-center">
                <span className="text-[9px] font-bold text-muted-foreground">D</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="rounded-b-2xl border-2 border-t-0 border-border bg-gradient-to-b from-card to-muted/10 p-5">
          <div className="space-y-3">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center gap-3">
                <span className="w-4 text-center text-[10px] font-bold text-muted-foreground">
                  {String.fromCharCode(65 + rowIndex)}
                </span>
                <div className="flex gap-2">
                  {row.slice(0, 2).map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      theme={theme}
                      isFlagged={Boolean(flaggedSeatId) && String(flaggedSeatId).toUpperCase() === String(seat.id).toUpperCase()}
                      seatChangeMode={seatChangeMode}
                      onClick={() => onSeatClick(seat.id)}
                    />
                  ))}
                </div>
                <div className="w-8 flex items-center justify-center">
                  <div className="h-px w-full bg-border/50" />
                </div>
                <div className="flex gap-2">
                  {row.slice(2, 4).map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      theme={theme}
                      isFlagged={Boolean(flaggedSeatId) && String(flaggedSeatId).toUpperCase() === String(seat.id).toUpperCase()}
                      seatChangeMode={seatChangeMode}
                      onClick={() => onSeatClick(seat.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-border/50 pt-3">
            <div className="flex items-center justify-center">
              <span className="w-4 text-center text-[10px] font-bold text-muted-foreground">←</span>
              <span className="text-[10px] text-muted-foreground ml-1">Back of bus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SeatMap;