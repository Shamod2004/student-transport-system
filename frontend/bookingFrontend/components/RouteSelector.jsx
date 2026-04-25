import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

const cities = [
  "Colombo",
  "Kandy",
  "Galle",
  "Jaffna",
  "Matara",
  "Kurunegala",
  "Anuradhapura",
  "Badulla",
  "Ratnapura",
  "Negombo",
];

const RouteSelector = ({ from, to, date, onFromChange, onToChange, onDateChange }) => {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Select Your Route</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">From</label>
          <Select value={from} onValueChange={onFromChange}>
            <SelectTrigger>
              <SelectValue placeholder="Departure city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To</label>
          <Select value={to} onValueChange={onToChange}>
            <SelectTrigger>
              <SelectValue placeholder="Arrival city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Date</label>
          <div className="relative">
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteSelector;
