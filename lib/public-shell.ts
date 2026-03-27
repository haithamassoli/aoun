export function isStudentFacingPath(pathname: string) {
  return pathname !== "/login" && !pathname.startsWith("/dashboard");
}
