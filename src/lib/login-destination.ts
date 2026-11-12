export function loginDestination(isAdmin: boolean) {
  return isAdmin ? '/admin' as const : '/app' as const;
}