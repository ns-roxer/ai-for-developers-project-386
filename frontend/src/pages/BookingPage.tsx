import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { useEventTypes } from "@/hooks/useEventTypes";
import { useAvailableSlots } from "@/hooks/useAvailableSlots";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import type { ErrorResponse } from "@/api/types";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const bookingSchema = z.object({
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z.string().email("Valid email is required"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const { data: eventTypes } = useEventTypes();
  const eventType = eventTypes?.find((et) => et.id === eventTypeId);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(
    undefined
  );
  const [booked, setBooked] = useState(false);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const {
    data: slots,
    isLoading: slotsLoading,
    error: slotsError,
  } = useAvailableSlots(eventTypeId, dateStr);

  const createBooking = useCreateBooking();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });

  const today = new Date();
  const maxDate = addDays(today, 13);

  const onSubmit = (values: BookingFormValues) => {
    if (!eventTypeId || !selectedSlot) return;
    createBooking.mutate(
      {
        eventTypeId,
        startTime: selectedSlot,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
      },
      {
        onSuccess: () => {
          setBooked(true);
          toast.success("Booking confirmed!");
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ErrorResponse>;
          const msg =
            axiosErr.response?.data?.message || "Failed to create booking";
          toast.error(msg);
        },
      }
    );
  };

  if (booked) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold">✅ Booking Confirmed</h1>
        <p className="text-muted-foreground">
          Your call has been booked. You will receive a confirmation email
          shortly.
        </p>
        <Link to="/">
          <Button>Back to Event Types</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Event Types
        </Link>
      </div>

      {eventType && (
        <div>
          <h1 className="text-2xl font-bold">{eventType.name}</h1>
          <p className="text-muted-foreground">
            {eventType.description} · {eventType.duration} min
          </p>
        </div>
      )}

      {/* Step 1: Pick a date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Pick a date</CardTitle>
          <CardDescription>
            Select a date within the next 14 days
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(undefined);
            }}
            disabled={(date) => date < today || date > maxDate}
            fromDate={today}
            toDate={maxDate}
          />
        </CardContent>
      </Card>

      {/* Step 2: Pick a time slot */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Pick a time slot</CardTitle>
            <CardDescription>
              Available slots for {format(selectedDate, "MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slotsLoading && (
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-24" />
                ))}
              </div>
            )}
            {slotsError && (
              <p className="text-destructive text-sm">
                Failed to load available slots.
              </p>
            )}
            {slots && slots.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No available slots for this date.
              </p>
            )}
            {slots && slots.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {slots.map((slot) => {
                  const startFormatted = format(
                    new Date(slot.startTime),
                    "HH:mm"
                  );
                  return (
                    <Button
                      key={slot.startTime}
                      variant={
                        selectedSlot === slot.startTime ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedSlot(slot.startTime)}
                    >
                      {startFormatted}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Enter your details */}
      {selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Enter your details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Name</Label>
                <Input
                  id="guestName"
                  placeholder="Your name"
                  {...register("guestName")}
                />
                {errors.guestName && (
                  <p className="text-destructive text-sm">
                    {errors.guestName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  placeholder="you@example.com"
                  {...register("guestEmail")}
                />
                {errors.guestEmail && (
                  <p className="text-destructive text-sm">
                    {errors.guestEmail.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={createBooking.isPending}
                className="w-full"
              >
                {createBooking.isPending ? "Booking…" : "Confirm Booking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

