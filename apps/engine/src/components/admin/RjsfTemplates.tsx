import type { ObjectFieldTemplateProps, FieldTemplateProps } from "@rjsf/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { title, description, properties, uiSchema, idSchema } = props;

  // Root level objects (business, theme, etc.) shouldn't be wrapped
  const schemaId = idSchema?.$id || "";
  const isRootLevel = schemaId === "root" || schemaId.split("_").length <= 2;

  // Skip wrapping for certain root-level objects or arrays
  if (isRootLevel || !title) {
    return (
      <div className="space-y-4">
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {properties.map((element) => element.content)}
      </div>
    );
  }

  // Wrap nested objects in cards
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {properties.map((element) => element.content)}
      </CardContent>
    </Card>
  );
}

export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    classNames,
    label,
    help,
    required,
    description,
    errors,
    children,
    schema,
    uiSchema,
  } = props;

  // Don't render label for object fields (they're handled by ObjectFieldTemplate)
  if (schema.type === "object") {
    return <div className={classNames}>{children}</div>;
  }

  return (
    <div className={classNames}>
      {children}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {errors && <div className="text-xs text-destructive mt-1">{errors}</div>}
      {help && <div className="text-xs text-muted-foreground mt-1">{help}</div>}
    </div>
  );
}
