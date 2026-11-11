import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomField } from "@/lib/modules";

export function CustomFieldInput({ field, value, onChange }: { field: CustomField; value: string; onChange: (v: string) => void }) {
  if (field.type === "select") {
    return (
      <Select {...(value ? { value } : {})} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(field.options ?? []).filter(Boolean).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      id={`cf-${field.key}`}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-xl"
    />
  );
}
