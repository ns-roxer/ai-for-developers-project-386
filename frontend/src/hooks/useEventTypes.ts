import { useQuery } from "@tanstack/react-query";
import { getEventTypes } from "@/api/client";

export function useEventTypes() {
  return useQuery({
    queryKey: ["eventTypes"],
    queryFn: getEventTypes,
  });
}

