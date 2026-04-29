import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "@/api/client";

export function useAvailableSlots(
  eventTypeId: string | undefined,
  date: string | undefined
) {
  return useQuery({
    queryKey: ["availableSlots", eventTypeId, date],
    queryFn: () => getAvailableSlots(eventTypeId!, date!),
    enabled: !!eventTypeId && !!date,
  });
}

