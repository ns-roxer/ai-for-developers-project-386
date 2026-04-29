import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";

import { useCreateEventType } from "@/hooks/useCreateEventType";
import type { ErrorResponse } from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const eventTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().int().min(1, "Duration must be at least 1 minute"),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

export default function CreateEventTypePage() {
  const navigate = useNavigate();
  const createEventType = useCreateEventType();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: { name: "", description: "", duration: 30 },
  });

  const onSubmit = (values: EventTypeFormValues) => {
    createEventType.mutate(values, {
      onSuccess: () => {
        toast.success("Event type created!");
        navigate("/");
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ErrorResponse>;
        const msg =
          axiosErr.response?.data?.message || "Failed to create event type";
        toast.error(msg);
      },
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Event Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Quick Chat" {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this call type"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-destructive text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                {...register("duration", { valueAsNumber: true })}
              />
              {errors.duration && (
                <p className="text-destructive text-sm">
                  {errors.duration.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={createEventType.isPending}
              className="w-full"
            >
              {createEventType.isPending ? "Creating…" : "Create Event Type"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

