import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { ApiService } from "./api.service";
export const adminGuard: CanActivateFn = async () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return (await api.me()) ? true : router.createUrlTree(["/ingresar"]);
};
