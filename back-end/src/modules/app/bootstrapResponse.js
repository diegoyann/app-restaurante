export function assembleBootstrapResponse(bootstrap, currentUserPermissions) {
  return {
    ...bootstrap,
    currentUserPermissions
  };
}
