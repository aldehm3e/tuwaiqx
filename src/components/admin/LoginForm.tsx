import { Field, inputClass } from "@/src/components/admin/Ui";
import { SmartForm } from "@/src/components/admin/SmartForm";

export function LoginForm() {
  return (
    <SmartForm action="/api/admin/login" redirectTo="/admin" submitLabel="Login" className="space-y-4">
      <Field label="Email">
        <input className={inputClass} name="email" required type="email" />
      </Field>
      <Field label="Password">
        <input className={inputClass} name="password" required type="password" />
      </Field>
    </SmartForm>
  );
}

