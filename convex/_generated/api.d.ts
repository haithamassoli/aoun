/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as courses from "../courses.js";
import type * as dashboard from "../dashboard.js";
import type * as helpers from "../helpers.js";
import type * as majors from "../majors.js";
import type * as migrations from "../migrations.js";
import type * as news from "../news.js";
import type * as newsInternal from "../newsInternal.js";
import type * as notifications from "../notifications.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as resources from "../resources.js";
import type * as searchUtils from "../searchUtils.js";
import type * as seed from "../seed.js";
import type * as seedJustEe from "../seedJustEe.js";
import type * as sitemap from "../sitemap.js";
import type * as universities from "../universities.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authActions: typeof authActions;
  courses: typeof courses;
  dashboard: typeof dashboard;
  helpers: typeof helpers;
  majors: typeof majors;
  migrations: typeof migrations;
  news: typeof news;
  newsInternal: typeof newsInternal;
  notifications: typeof notifications;
  pushSubscriptions: typeof pushSubscriptions;
  resources: typeof resources;
  searchUtils: typeof searchUtils;
  seed: typeof seed;
  seedJustEe: typeof seedJustEe;
  sitemap: typeof sitemap;
  universities: typeof universities;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
