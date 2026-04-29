import { format } from "date-fns";
import { useUpcomingBookings } from "@/hooks/useUpcomingBookings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function UpcomingBookingsPage() {
  const { data: bookings, isLoading, error } = useUpcomingBookings();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upcoming Bookings</h1>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-destructive">Failed to load bookings.</p>
      )}

      {bookings && bookings.length === 0 && (
        <p className="text-muted-foreground">No upcoming bookings.</p>
      )}

      {bookings && bookings.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead>Guest Email</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    {b.eventTypeName}
                  </TableCell>
                  <TableCell>{b.guestName}</TableCell>
                  <TableCell>{b.guestEmail}</TableCell>
                  <TableCell>
                    {format(new Date(b.startTime), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(b.endTime), "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

