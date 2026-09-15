import pg from "pg";
import jwt from "jsonwebtoken";
import { normalizeCpf, isValidCpf } from "./cpf.mjs";
import { log } from "./logger.mjs";

const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS ?? 3600);
const ISSUER = "auto-repair-auth";
const AUDIENCE = "customer";

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  ssl: { rejectUnauthorized: false }
});

function respond(statusCode, body, requestId) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId
    },
    body: JSON.stringify(body)
  };
}

function failure(statusCode, code, message, requestId) {
  return respond(statusCode, { error: { code, message } }, requestId);
}

function parseBody(event) {
  if (!event.body) return {};

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  return JSON.parse(raw);
}

export async function handler(event) {
  const requestId = event.requestContext?.requestId ?? "local";
  const startedAt = Date.now();

  let cpf;
  try {
    cpf = normalizeCpf(parseBody(event).cpf);
  } catch {
    return failure(400, "invalid_request", "Request body must be valid JSON", requestId);
  }

  if (!isValidCpf(cpf)) {
    log("warn", "CPF rejected", { requestId, reason: "invalid_format" });
    return failure(400, "invalid_cpf", "The CPF provided is not valid", requestId);
  }

  let customer;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, deleted_at
         FROM customers
        WHERE document = $1
          AND kind = 'individual'
        LIMIT 1`,
      [cpf]
    );
    customer = rows[0];
  } catch (error) {
    log("error", "Database lookup failed", { requestId, error: error.message });
    return failure(503, "database_unavailable", "Could not reach the customer database", requestId);
  }

  if (!customer) {
    log("warn", "CPF rejected", { requestId, reason: "not_found" });
    return failure(404, "customer_not_found", "No customer registered with this CPF", requestId);
  }

  if (customer.deleted_at) {
    log("warn", "CPF rejected", { requestId, reason: "inactive", customerId: customer.id });
    return failure(403, "customer_inactive", "This customer is no longer active", requestId);
  }

  const token = jwt.sign(
    {
      sub: String(customer.id),
      name: customer.name,
      document: cpf
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      audience: AUDIENCE,
      issuer: ISSUER,
      expiresIn: TOKEN_TTL_SECONDS
    }
  );

  log("info", "Token issued", {
    requestId,
    customerId: customer.id,
    durationMs: Date.now() - startedAt
  });

  return respond(
    200,
    {
      token,
      token_type: "Bearer",
      expires_in: TOKEN_TTL_SECONDS,
      customer: { id: customer.id, name: customer.name }
    },
    requestId
  );
}
