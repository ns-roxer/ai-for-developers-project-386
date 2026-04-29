import { useQuery } from "@tanstack/react-query";
import { getUpcomingBookings } from "@/api/client";

export function useUpcomingBookings() {
  return useQuery({
    queryKey: ["upcomingBookings"],
    queryFn: getUpcomingBookings,
  });
}

