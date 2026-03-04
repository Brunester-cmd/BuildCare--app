import { IRequest, Router } from 'itty-router';

export interface Env {
    DB: D1Database;
    ENVIRONMENT: string;
}

const router = Router();

// ── CORS ──────────────────────────────────────────────────────────
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

router.all('*', (request: IRequest) => {
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }
});

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });

const err = (msg: string, status = 500) => json({ error: msg }, status);

// ── Health ────────────────────────────────────────────────────────
router.get('/api/health', () => json({ status: 'ok' }));

// ── TENANTS ───────────────────────────────────────────────────────
router.get('/api/tenants', async (_req: IRequest, env: Env) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all();
        return json(results);
    } catch (e: any) { return err(e.message); }
});

router.post('/api/tenants', async (request: IRequest, env: Env) => {
    try {
        const body: any = await request.json();
        const id = crypto.randomUUID();
        await env.DB.prepare(
            'INSERT INTO tenants (id, name, slug, active, created_at) VALUES (?, ?, ?, 1, ?)'
        ).bind(id, body.name, body.slug, new Date().toISOString()).run();
        const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
        return json(tenant, 201);
    } catch (e: any) { return err(e.message); }
});

router.put('/api/tenants/:id', async (request: IRequest, env: Env) => {
    try {
        const { id } = request.params as { id: string };
        const body: any = await request.json();
        const sets: string[] = [];
        const vals: unknown[] = [];
        for (const [k, v] of Object.entries(body)) {
            sets.push(`${k} = ?`);
            vals.push(v);
        }
        vals.push(id);
        await env.DB.prepare(`UPDATE tenants SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first();
        return json(tenant);
    } catch (e: any) { return err(e.message); }
});

router.delete('/api/tenants/:id', async (request: IRequest, env: Env) => {
    try {
        const { id } = request.params as { id: string };
        // Cascade delete: history → orders → profiles → tenant
        await env.DB.prepare('DELETE FROM work_order_history WHERE tenant_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM work_orders WHERE tenant_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM profiles WHERE tenant_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM tenants WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    } catch (e: any) { return err(e.message); }
});

// ── PROFILES ──────────────────────────────────────────────────────
router.get('/api/profiles', async (request: IRequest, env: Env) => {
    try {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenant_id');
        const status = url.searchParams.get('status');

        let query = 'SELECT * FROM profiles WHERE 1=1';
        const binds: unknown[] = [];
        if (tenantId) { query += ' AND tenant_id = ?'; binds.push(tenantId); }
        if (status) { query += ' AND status = ?'; binds.push(status); }
        query += ' ORDER BY full_name ASC';

        const { results } = await env.DB.prepare(query).bind(...binds).all();
        return json(results);
    } catch (e: any) { return err(e.message); }
});

router.put('/api/profiles/:id', async (request: IRequest, env: Env) => {
    try {
        const { id } = request.params as { id: string };
        const body: any = await request.json();
        const sets: string[] = [];
        const vals: unknown[] = [];
        for (const [k, v] of Object.entries(body)) {
            sets.push(`${k} = ?`);
            vals.push(v);
        }
        vals.push(id);
        await env.DB.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first();
        return json(profile);
    } catch (e: any) { return err(e.message); }
});

router.delete('/api/profiles/:id', async (request: IRequest, env: Env) => {
    try {
        const { id } = request.params as { id: string };
        await env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    } catch (e: any) { return err(e.message); }
});

// Create user (no auth yet — inserts directly into profiles)
router.post('/api/users', async (request: IRequest, env: Env) => {
    try {
        const body: any = await request.json();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(
            `INSERT INTO profiles (id, tenant_id, full_name, email, role, status, company_name, push_enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
        ).bind(
            id,
            body.tenant_id ?? null,
            body.full_name,
            body.email,
            body.role ?? 'user',
            body.status ?? 'active',
            body.company_name ?? '',
            now, now
        ).run();
        const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first();
        return json(profile, 201);
    } catch (e: any) { return err(e.message); }
});

// ── WORK ORDERS ───────────────────────────────────────────────────
router.get('/api/orders', async (request: IRequest, env: Env) => {
    try {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenant_id');
        if (!tenantId) return err('tenant_id is required', 400);
        const { results } = await env.DB.prepare(
            'SELECT * FROM work_orders WHERE tenant_id = ? ORDER BY order_number DESC'
        ).bind(tenantId).all();
        return json(results);
    } catch (e: any) { return err(e.message); }
});

router.post('/api/orders', async (request: IRequest, env: Env) => {
    try {
        const body: any = await request.json();
        const now = new Date().toISOString();
        await env.DB.prepare(
            `INSERT INTO work_orders (id, order_number, tenant_id, created_by, titulo, descripcion, prioridad, ubicacion, categoria, asignado_a, estado, fecha_programada, attachments, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            body.id, body.order_number, body.tenant_id, body.created_by,
            body.titulo, body.descripcion, body.prioridad, body.ubicacion,
            body.categoria, body.asignado_a, body.estado ?? 'pendiente',
            body.fecha_programada ?? null, body.attachments ?? '[]',
            now, now
        ).run();
        const order = await env.DB.prepare('SELECT * FROM work_orders WHERE id = ?').bind(body.id).first();
        return json(order, 201);
    } catch (e: any) { return err(e.message); }
});

router.put('/api/orders/:id', async (request: IRequest, env: Env) => {
    try {
        const { id } = request.params as { id: string };
        const body: any = await request.json();
        const sets: string[] = ['updated_at = ?'];
        const vals: unknown[] = [new Date().toISOString()];
        for (const [k, v] of Object.entries(body)) {
            sets.push(`${k} = ?`);
            vals.push(v);
        }
        vals.push(id);
        await env.DB.prepare(`UPDATE work_orders SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        const order = await env.DB.prepare('SELECT * FROM work_orders WHERE id = ?').bind(id).first();
        return json(order);
    } catch (e: any) { return err(e.message); }
});

router.delete('/api/orders/:id', async (request: IRequest, env: Env) => {
    try {
        const { id } = request.params as { id: string };
        await env.DB.prepare('DELETE FROM work_order_history WHERE work_order_id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM work_orders WHERE id = ?').bind(id).run();
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    } catch (e: any) { return err(e.message); }
});

// ── HISTORY ───────────────────────────────────────────────────────
router.get('/api/history', async (request: IRequest, env: Env) => {
    try {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get('tenant_id');
        const workOrderId = url.searchParams.get('work_order_id');
        if (!tenantId) return err('tenant_id is required', 400);

        let query = 'SELECT * FROM work_order_history WHERE tenant_id = ?';
        const binds: unknown[] = [tenantId];
        if (workOrderId) { query += ' AND work_order_id = ?'; binds.push(workOrderId); }
        query += ' ORDER BY created_at DESC LIMIT 100';

        const { results } = await env.DB.prepare(query).bind(...binds).all();
        return json(results);
    } catch (e: any) { return err(e.message); }
});

// ── 404 Fallback ──────────────────────────────────────────────────
router.all('*', () => new Response('Not Found.', { status: 404, headers: CORS_HEADERS }));

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return router.handle(request, env, ctx).catch((error: any) => {
            console.error(error);
            return json({ error: error.message || 'Server Error' }, 500);
        });
    },
};
