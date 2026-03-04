var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-UzqMG1/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((o3, r2, a, s) => (o4, ...n) => t2.push([r2.toUpperCase?.(), RegExp(`^${(s = (e + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), n, s]) && a, "get") }), routes: t2, ...o2, async fetch(e2, ...r2) {
  let a, s, n = new URL(e2.url), c = e2.query = { __proto__: null };
  for (let [e3, t3] of n.searchParams) c[e3] = c[e3] ? [].concat(c[e3], t3) : t3;
  e: try {
    for (let t3 of o2.before || []) if (null != (a = await t3(e2.proxy ?? e2, ...r2))) break e;
    t: for (let [o3, c2, l, i] of t2) if ((o3 == e2.method || "ALL" == o3) && (s = n.pathname.match(c2))) {
      e2.params = s.groups || {}, e2.route = i;
      for (let t3 of l) if (null != (a = await t3(e2.proxy ?? e2, ...r2))) break t;
    }
  } catch (t3) {
    if (!o2.catch) throw t3;
    a = await o2.catch(t3, e2.proxy ?? e2, ...r2);
  }
  try {
    for (let t3 of o2.finally || []) a = await t3(a, e2.proxy ?? e2, ...r2) ?? a;
  } catch (t3) {
    if (!o2.catch) throw t3;
    a = await o2.catch(t3, e2.proxy ?? e2, ...r2);
  }
  return a;
} }), "t");
var o = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (o2, r2 = {}) => {
  if (void 0 === o2 || o2 instanceof Response) return o2;
  const a = new Response(t2?.(o2) ?? o2, r2.url ? void 0 : r2);
  return a.headers.set("content-type", e), a;
}, "o");
var r = o("application/json; charset=utf-8", JSON.stringify);
var p = o("text/plain; charset=utf-8", String);
var f = o("text/html");
var u = o("image/jpeg");
var h = o("image/png");
var g = o("image/webp");

// worker/index.ts
var router = t();
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
router.all("*", (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
});
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", ...CORS_HEADERS }
}), "json");
var err = /* @__PURE__ */ __name((msg, status = 500) => json({ error: msg }, status), "err");
router.get("/api/health", () => json({ status: "ok" }));
router.get("/api/tenants", async (_req, env) => {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM tenants ORDER BY created_at DESC").all();
    return json(results);
  } catch (e) {
    return err(e.message);
  }
});
router.post("/api/tenants", async (request, env) => {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO tenants (id, name, slug, active, created_at) VALUES (?, ?, ?, 1, ?)"
    ).bind(id, body.name, body.slug, (/* @__PURE__ */ new Date()).toISOString()).run();
    const tenant = await env.DB.prepare("SELECT * FROM tenants WHERE id = ?").bind(id).first();
    return json(tenant, 201);
  } catch (e) {
    return err(e.message);
  }
});
router.put("/api/tenants/:id", async (request, env) => {
  try {
    const { id } = request.params;
    const body = await request.json();
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(body)) {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
    vals.push(id);
    await env.DB.prepare(`UPDATE tenants SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
    const tenant = await env.DB.prepare("SELECT * FROM tenants WHERE id = ?").bind(id).first();
    return json(tenant);
  } catch (e) {
    return err(e.message);
  }
});
router.delete("/api/tenants/:id", async (request, env) => {
  try {
    const { id } = request.params;
    await env.DB.prepare("DELETE FROM work_order_history WHERE tenant_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM work_orders WHERE tenant_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM profiles WHERE tenant_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM tenants WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  } catch (e) {
    return err(e.message);
  }
});
router.get("/api/profiles", async (request, env) => {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenant_id");
    const status = url.searchParams.get("status");
    let query = "SELECT * FROM profiles WHERE 1=1";
    const binds = [];
    if (tenantId) {
      query += " AND tenant_id = ?";
      binds.push(tenantId);
    }
    if (status) {
      query += " AND status = ?";
      binds.push(status);
    }
    query += " ORDER BY full_name ASC";
    const { results } = await env.DB.prepare(query).bind(...binds).all();
    return json(results);
  } catch (e) {
    return err(e.message);
  }
});
router.put("/api/profiles/:id", async (request, env) => {
  try {
    const { id } = request.params;
    const body = await request.json();
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(body)) {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
    vals.push(id);
    await env.DB.prepare(`UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
    const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
    return json(profile);
  } catch (e) {
    return err(e.message);
  }
});
router.delete("/api/profiles/:id", async (request, env) => {
  try {
    const { id } = request.params;
    await env.DB.prepare("DELETE FROM profiles WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  } catch (e) {
    return err(e.message);
  }
});
router.post("/api/users", async (request, env) => {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `INSERT INTO profiles (id, tenant_id, full_name, email, role, status, company_name, push_enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(
      id,
      body.tenant_id ?? null,
      body.full_name,
      body.email,
      body.role ?? "user",
      body.status ?? "active",
      body.company_name ?? "",
      now,
      now
    ).run();
    const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first();
    return json(profile, 201);
  } catch (e) {
    return err(e.message);
  }
});
router.get("/api/orders", async (request, env) => {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenant_id");
    if (!tenantId) return err("tenant_id is required", 400);
    const { results } = await env.DB.prepare(
      "SELECT * FROM work_orders WHERE tenant_id = ? ORDER BY order_number DESC"
    ).bind(tenantId).all();
    return json(results);
  } catch (e) {
    return err(e.message);
  }
});
router.post("/api/orders", async (request, env) => {
  try {
    const body = await request.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `INSERT INTO work_orders (id, order_number, tenant_id, created_by, titulo, descripcion, prioridad, ubicacion, categoria, asignado_a, estado, fecha_programada, attachments, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.id,
      body.order_number,
      body.tenant_id,
      body.created_by,
      body.titulo,
      body.descripcion,
      body.prioridad,
      body.ubicacion,
      body.categoria,
      body.asignado_a,
      body.estado ?? "pendiente",
      body.fecha_programada ?? null,
      body.attachments ?? "[]",
      now,
      now
    ).run();
    const order = await env.DB.prepare("SELECT * FROM work_orders WHERE id = ?").bind(body.id).first();
    return json(order, 201);
  } catch (e) {
    return err(e.message);
  }
});
router.put("/api/orders/:id", async (request, env) => {
  try {
    const { id } = request.params;
    const body = await request.json();
    const sets = ["updated_at = ?"];
    const vals = [(/* @__PURE__ */ new Date()).toISOString()];
    for (const [k, v] of Object.entries(body)) {
      sets.push(`${k} = ?`);
      vals.push(v);
    }
    vals.push(id);
    await env.DB.prepare(`UPDATE work_orders SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
    const order = await env.DB.prepare("SELECT * FROM work_orders WHERE id = ?").bind(id).first();
    return json(order);
  } catch (e) {
    return err(e.message);
  }
});
router.delete("/api/orders/:id", async (request, env) => {
  try {
    const { id } = request.params;
    await env.DB.prepare("DELETE FROM work_order_history WHERE work_order_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM work_orders WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  } catch (e) {
    return err(e.message);
  }
});
router.get("/api/history", async (request, env) => {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenant_id");
    const workOrderId = url.searchParams.get("work_order_id");
    if (!tenantId) return err("tenant_id is required", 400);
    let query = "SELECT * FROM work_order_history WHERE tenant_id = ?";
    const binds = [tenantId];
    if (workOrderId) {
      query += " AND work_order_id = ?";
      binds.push(workOrderId);
    }
    query += " ORDER BY created_at DESC LIMIT 100";
    const { results } = await env.DB.prepare(query).bind(...binds).all();
    return json(results);
  } catch (e) {
    return err(e.message);
  }
});
router.all("*", () => new Response("Not Found.", { status: 404, headers: CORS_HEADERS }));
var worker_default = {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx).catch((error) => {
      console.error(error);
      return json({ error: error.message || "Server Error" }, 500);
    });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-UzqMG1/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-UzqMG1/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
