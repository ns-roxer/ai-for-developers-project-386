import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBooking } from "@/api/client";

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableSlots"] });
    },
  });
}

