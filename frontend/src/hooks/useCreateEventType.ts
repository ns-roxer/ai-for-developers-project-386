import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventType } from "@/api/client";

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEventType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
  });
}

