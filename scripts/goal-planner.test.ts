import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStep, extractJsonObject } from "./lib/goal-step.js";

test("validateStep accepts a well-formed step", () => {
  const r = validateStep({
    title: "Publish the specialist demo site",
    type: "human",
    rationale: "A live demo is the fastest proof for the first client.",
    milestoneLabel: "First client live",
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.type, "human");
});

test("validateStep rejects an invalid type", () => {
  const r = validateStep({ title: "x", type: "marketing", rationale: "y", milestoneLabel: "m" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.includes("type must be one of")));
});

test("validateStep rejects missing/empty fields", () => {
  assert.equal(validateStep({}).ok, false);
  assert.equal(validateStep({ title: "  ", type: "code", rationale: "r", milestoneLabel: "m" }).ok, false);
  assert.equal(validateStep({ title: "t", type: "code", rationale: "", milestoneLabel: "m" }).ok, false);
  assert.equal(validateStep("not an object").ok, false);
});

test("validateStep rejects an over-long title", () => {
  const r = validateStep({ title: "x".repeat(121), type: "bug", rationale: "r", milestoneLabel: "m" });
  assert.equal(r.ok, false);
});

test("extractJsonObject pulls JSON out of fenced / chatty output", () => {
  const fenced = 'Here you go:\n```json\n{"title":"t","type":"code","rationale":"r","milestoneLabel":"m"}\n```\nDone.';
  const json = extractJsonObject(fenced);
  assert.ok(json);
  assert.equal(JSON.parse(json!).type, "code");
});

test("extractJsonObject handles nested braces and strings with braces", () => {
  const text = '{"title":"use {curly} braces","type":"human","rationale":"a { b }","milestoneLabel":"m"}';
  const json = extractJsonObject(text);
  assert.equal(json, text);
});

test("extractJsonObject returns null when no object present", () => {
  assert.equal(extractJsonObject("no json here"), null);
});
