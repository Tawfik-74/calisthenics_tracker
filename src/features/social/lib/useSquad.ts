import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { squadApi } from '../api/squadApi';
import { nudgeApi } from '../api/nudgeApi';
import type { InviteFriendsInput, SendNudgeInput } from '../model/squad.schema';

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

export function useSendNudge() {
  return useMutation({
    mutationFn: (input: SendNudgeInput) => nudgeApi.send(input),
  });
}
