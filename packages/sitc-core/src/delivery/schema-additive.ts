/**
 * Additive-by-construction schema check (DESIGN §7.3 / §12).
 *
 * A run may only change `business.schema.json` ADDITIVELY: add enum values, add
 * OPTIONAL properties, add new definitions. It must NOT remove properties/enum
 * values, add required fields, or change a property's type — any of which could
 * break existing templates. Pure structural diff → exhaustively unit-tested.
 */
export interface AdditiveResult {
  additive: boolean;
  violations: string[];
}

type Json = Record<string, unknown>;

function typeOf(node: unknown): string | undefined {
  return node && typeof node === "object" ? ((node as Json).type as string | undefined) : undefined;
}

/** Walk old vs new schema; collect non-additive changes. */
export function isAdditiveSchemaChange(oldSchema: unknown, newSchema: unknown): AdditiveResult {
  const violations: string[] = [];

  function walk(o: unknown, n: unknown, path: string): void {
    if (o == null) return; // new subtree — additive
    if (typeof o !== "object") return;
    const oo = o as Json;
    const nn = (n ?? {}) as Json;

    // type must not change
    const ot = typeOf(oo);
    const nt = typeOf(nn);
    if (ot && nt && ot !== nt) violations.push(`${path}: type changed ${ot}→${nt}`);

    // enum values must not be removed
    if (Array.isArray(oo.enum)) {
      const newEnum = new Set((Array.isArray(nn.enum) ? nn.enum : []) as unknown[]);
      for (const v of oo.enum as unknown[]) {
        if (!newEnum.has(v)) violations.push(`${path}/enum: removed value ${JSON.stringify(v)}`);
      }
    }

    // required must not gain entries (no NEW required fields)
    if (Array.isArray(nn.required)) {
      const oldReq = new Set((Array.isArray(oo.required) ? oo.required : []) as unknown[]);
      for (const r of nn.required as unknown[]) {
        if (!oldReq.has(r)) violations.push(`${path}/required: new required field ${JSON.stringify(r)}`);
      }
    }

    // properties must not be removed; recurse into shared ones
    if (oo.properties && typeof oo.properties === "object") {
      const oProps = oo.properties as Json;
      const nProps = (nn.properties ?? {}) as Json;
      for (const key of Object.keys(oProps)) {
        if (!(key in nProps)) violations.push(`${path}/properties: removed property "${key}"`);
        else walk(oProps[key], nProps[key], `${path}/properties/${key}`);
      }
    }

    // recurse definitions / $defs
    for (const defKey of ["definitions", "$defs"]) {
      if (oo[defKey] && typeof oo[defKey] === "object") {
        const oDefs = oo[defKey] as Json;
        const nDefs = (nn[defKey] ?? {}) as Json;
        for (const key of Object.keys(oDefs)) {
          if (!(key in nDefs)) violations.push(`${path}/${defKey}: removed definition "${key}"`);
          else walk(oDefs[key], nDefs[key], `${path}/${defKey}/${key}`);
        }
      }
    }

    // recurse array item schema
    if (oo.items) walk(oo.items, nn.items, `${path}/items`);
  }

  walk(oldSchema, newSchema, "#");
  return { additive: violations.length === 0, violations };
}
