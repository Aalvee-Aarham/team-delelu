import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/axios";
import type { Attachment, Comment, CommentTarget, CourseStream, Submission, UploadConfig } from "@/lib/types";

export function useUploadConfig() {
  return useQuery({
    queryKey: ["upload-config"],
    queryFn: async () => (await api.get<UploadConfig>("/uploads/config")).data,
    staleTime: Infinity,
  });
}

export function useCourseStream(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", "stream", courseId],
    queryFn: async () => (await api.get<CourseStream>(`/courses/${courseId}/stream`)).data,
    enabled: Boolean(courseId),
  });
}

export function useSubmissions(params?: { assignment_id?: string; course_id?: string; status?: string }) {
  const clean = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v));
  return useQuery({
    queryKey: ["submissions", clean],
    queryFn: async () => (await api.get<Submission[]>("/submissions", { params: clean })).data,
  });
}

function useClassroomInvalidator() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["submissions"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
  };
}

export function useSubmitWork() {
  const invalidate = useClassroomInvalidator();
  return useMutation({
    mutationFn: async (payload: { assignment_id: string; text: string; attachments: Attachment[] }) =>
      (await api.post<Submission>("/submissions", payload)).data,
    onSuccess: () => {
      invalidate();
      toast.success("Work handed in");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useWithdrawWork() {
  const invalidate = useClassroomInvalidator();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/submissions/${id}`)).data,
    onSuccess: () => {
      invalidate();
      toast.success("Submission withdrawn");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useReviewSubmission() {
  const invalidate = useClassroomInvalidator();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      status: Submission["status"];
      grade: number | null;
      feedback: string;
    }) => (await api.patch<Submission>(`/submissions/${id}/review`, payload)).data,
    onSuccess: (doc) => {
      invalidate();
      toast.success(doc.status === "accepted" ? "Submission accepted" : `Submission marked ${doc.status}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useComments(targetType: CommentTarget, targetId: string | undefined) {
  return useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn: async () =>
      (await api.get<Comment[]>("/comments", { params: { target_type: targetType, target_id: targetId } })).data,
    enabled: Boolean(targetId),
  });
}

export function useCommentMutations(targetType: CommentTarget, targetId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["comments", targetType, targetId] });

  const post = useMutation({
    mutationFn: async (payload: { body: string; parent_id?: string; course_id?: string }) =>
      (
        await api.post<Comment>("/comments", {
          target_type: targetType,
          target_id: targetId,
          course_id: payload.course_id ?? "",
          parent_id: payload.parent_id ?? "",
          body: payload.body,
        })
      ).data,
    onSuccess: invalidate,
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/comments/${id}`)).data,
    onSuccess: () => {
      invalidate();
      toast.success("Comment deleted");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return { post, remove };
}
