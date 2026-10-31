import { verifyBuyerBatch } from "../lib/buyer-verification.mjs";

const MAX_CANDIDATES = 50;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const candidates = Array.isArray(body.candidates)
      ? body.candidates
      : body.candidate && typeof body.candidate === "object"
        ? [body.candidate]
        : null;

    if (!candidates || candidates.length === 0) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Provide candidate or a non-empty candidates array."
      });
    }
    if (candidates.length > MAX_CANDIDATES) {
      return res.status(413).json({
        error: "too_many_candidates",
        message: `A maximum of ${MAX_CANDIDATES} candidates is allowed per request.`
      });
    }

    const result = verifyBuyerBatch(candidates, {
      maxAgeDays: 365,
      now: new Date()
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: "invalid_json",
      message: "Request body must be valid JSON."
    });
  }
}
