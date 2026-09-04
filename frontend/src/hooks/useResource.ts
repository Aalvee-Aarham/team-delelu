import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/axios";

export function useResourceList<T>(collection: string, params?: Record<string, string | undefined>) {
  const clean = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v));
  return useQuery({
    queryKey: [collection, clean],
    queryFn: async () => (await api.get<T[]>(`/${collection}`, { params: clean })).data,
  });
}

export function useResourceMutations<T extends { id: string }>(collection: string, label: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [collection] });

  const create = useMutation({
    mutationFn: async (payload: Partial<T>) => (await api.post<T>(`/${collection}`, payload)).data,
    onSuccess: () => {
      invalidate();
      toast.success(`${label} created`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<T> }) =>
      (await api.patch<T>(`/${collection}/${id}`, payload)).data,
    onSuccess: () => {
      invalidate();
      toast.success(`${label} updated`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/${collection}/${id}`)).data,
    onSuccess: () => {
      invalidate();
      toast.success(`${label} deleted`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { create, update, remove };
}
