import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  updateTeamMember,
} from "@/shared/api/team";
import type { TeamMember } from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

export function useTeamMembers() {
  return useQuery({
    queryKey: qk.teamMembers,
    queryFn: fetchTeamMembers,
  });
}

function useInvalidateTeam() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.teamMembers });
}

export function useCreateTeamMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (input: TablesInsert<"team_members">) => createTeamMember(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTeamMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (args: { id: string; input: TablesUpdate<"team_members"> }) =>
      updateTeamMember(args.id, args.input),
    onSuccess: invalidate,
  });
}

export function useDeleteTeamMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (member: TeamMember) => deleteTeamMember(member),
    onSuccess: invalidate,
  });
}
