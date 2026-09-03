import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import type { UserId } from '@/shared/types/ids';
import { squadApi } from '../api/squadApi';
import { nudgeApi } from '../api/nudgeApi';
import type { AddMemberInput, InviteFriendsInput, SendNudgeInput } from '../model/squad.schema';

export function useSquad() {
  return useQuery({
    queryKey: queryKeys.squad.mine(),
    queryFn: () => squadApi.mine(),
  });
}

export function useInviteFriends() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteFriendsInput) => squadApi.invite(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.squad.mine() }),
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberInput) => squadApi.addMember(input),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.squad.mine() }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: UserId) => squadApi.removeMember(userId),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.squad.mine() }),
  });
}

export function useSendNudge() {
  return useMutation({
    mutationFn: (input: SendNudgeInput) => nudgeApi.send(input),
  });
}
