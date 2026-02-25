export function compileTemplate(
  template: string,
  variables: Record<string, string>
) {
  let compiled = template;

  for (const key in variables) {
    compiled = compiled.replace(
      new RegExp(`{{${key}}}`, "g"),
      variables[key]
    );
  }

  return compiled;
}