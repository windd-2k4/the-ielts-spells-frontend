import { managementRoles, userRoles, type ManagementRole, type UserRole } from "@ielts/contracts";

export const managementPortalRoles = managementRoles;

export function isUserRole(value: string): value is UserRole {
  return (userRoles as readonly string[]).includes(value);
}

export function hasAnyRole(
  roles: readonly UserRole[],
  allowedRoles: readonly UserRole[],
): boolean {
  return allowedRoles.some((role) => roles.includes(role));
}

export function hasManagementAccess(roles: readonly UserRole[]): boolean {
  return hasAnyRole(roles, managementPortalRoles);
}

export function managementHome(roles: readonly UserRole[]): string {
  if (roles.includes("admin")) return "/dashboard";
  if (roles.includes("admissions")) return "/students";
  if (roles.includes("social_media")) return "/cms";
  if (roles.includes("student_support")) return "/support/courses";
  if (roles.includes("teacher")) return "/library";
  return "/login";
}

export type ManagementRouteRole = ManagementRole;
