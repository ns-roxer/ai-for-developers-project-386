import { Link } from "react-router-dom";
import { useEventTypes } from "@/hooks/useEventTypes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventTypeListPage() {
  const { data: eventTypes, isLoading, error } = useEventTypes();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Available Event Types</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load event types. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Available Event Types</h1>
      {eventTypes && eventTypes.length === 0 && (
        <p className="text-muted-foreground">
          No event types available yet. Ask an admin to create one.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {eventTypes?.map((et) => (
          <Card key={et.id}>
            <CardHeader>
              <CardTitle>{et.name}</CardTitle>
              <CardDescription>{et.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {et.duration} min
              </span>
              <Link to={`/book/${et.id}`}>
                <Button size="sm">Book</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

