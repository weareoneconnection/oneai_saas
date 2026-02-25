import Ajv2020Module from "ajv/dist/2020.js";

const Ajv2020Ctor: any = (Ajv2020Module as any).default ?? (Ajv2020Module as any);

export function createAjvValidator(schema: any) {
  const ajv = new Ajv2020Ctor({ allErrors: true });
  const validateFn = ajv.compile(schema);

  return {
    validate(data: any) {
      const ok = validateFn(data) as boolean;
      return { ok, errors: validateFn.errors ?? null };
    }
  };
}