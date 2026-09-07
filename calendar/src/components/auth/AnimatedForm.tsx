"use client";

import { memo, useState } from "react";
import { type ChangeEvent, type FormEvent } from "react";
import { Input, BoxReveal, BottomGradient } from "./AnimatedFormComponents";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FieldType = "text" | "email" | "password";

export type Field = {
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type AnimatedFormProps = {
  header: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  fieldPerRow?: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  googleLogin?: string;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  submitError?: string;
};

type Errors = Record<string, string>;

export const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  fieldPerRow = 1,
  onSubmit,
  googleLogin,
  goTo,
  submitError,
}: AnimatedFormProps) {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event: FormEvent<HTMLFormElement>): Errors => {
    const form = event.target as HTMLFormElement;
    const currentErrors: Errors = {};
    fields.forEach((field) => {
      const input = form.elements.namedItem(field.label) as HTMLInputElement | null;
      const value = input?.value;

      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} is required`;
      }
      if (field.type === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = "Invalid email address";
      }
      if (field.type === "password" && value && value.length < 6) {
        currentErrors[field.label] = "Password must be at least 6 characters long";
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formErrors = validateForm(event);

    if (Object.keys(formErrors).length === 0) {
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className="flex max-w-full flex-col gap-4 w-96 mx-auto">
      <BoxReveal boxColor="hsl(var(--skeleton))" duration={0.3}>
        <h2 className="font-bold text-3xl text-foreground">{header}</h2>
      </BoxReveal>

      {subHeader && (
        <BoxReveal boxColor="hsl(var(--skeleton))" duration={0.3} className="pb-2">
          <p className="text-muted-foreground text-sm max-w-sm">{subHeader}</p>
        </BoxReveal>
      )}

      {googleLogin && (
        <>
          <BoxReveal
            boxColor="hsl(var(--skeleton))"
            duration={0.3}
            overflow="visible"
            width="unset"
          >
            <button
              className="group/btn relative w-full rounded-md border border-border h-10 font-medium outline-none hover:bg-secondary/50 transition-colors flex items-center justify-center gap-3"
              type="button"
            >
              <img
                src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                width={20}
                height={20}
                alt="Google"
              />
              {googleLogin}
              <BottomGradient />
            </button>
          </BoxReveal>

          <BoxReveal boxColor="hsl(var(--skeleton))" duration={0.3} width="100%">
            <section className="flex items-center gap-4">
              <hr className="flex-1 border border-dashed border-border" />
              <p className="text-muted-foreground text-sm">or</p>
              <hr className="flex-1 border border-dashed border-border" />
            </section>
          </BoxReveal>
        </>
      )}

      <form onSubmit={handleSubmit} name="auth-form">
        <section
          className={cn("grid gap-4 mb-4", fieldPerRow === 2 ? "grid-cols-2" : "grid-cols-1")}
        >
          {fields.map((field) => (
            <section key={field.label} className="flex flex-col gap-2">
              <BoxReveal boxColor="hsl(var(--skeleton))" duration={0.3}>
                <Label htmlFor={field.label}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
              </BoxReveal>

              <BoxReveal
                width="100%"
                boxColor="hsl(var(--skeleton))"
                duration={0.3}
                className="flex flex-col space-y-2 w-full"
              >
                <section className="relative">
                  <Input
                    type={
                      field.type === "password" ? (visible ? "text" : "password") : field.type
                    }
                    id={field.label}
                    name={field.label}
                    placeholder={field.placeholder}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    required={field.required}
                  />

                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  )}
                </section>

                <section className="h-4">
                  {errors[field.label] && (
                    <p className="text-destructive text-xs">{errors[field.label]}</p>
                  )}
                </section>
              </BoxReveal>
            </section>
          ))}
        </section>

        <BoxReveal width="100%" boxColor="hsl(var(--skeleton))" duration={0.3}>
          {(errorField || submitError) && (
            <p className="text-destructive text-sm mb-4">{errorField ?? submitError}</p>
          )}
        </BoxReveal>

        <BoxReveal
          width="100%"
          boxColor="hsl(var(--skeleton))"
          duration={0.3}
          overflow="visible"
        >
          <button
            className="relative group/btn w-full from-primary to-primary/90 bg-primary text-primary-foreground rounded-md h-10 font-medium outline-none hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            type="submit"
          >
            {submitButton} &rarr;
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal boxColor="hsl(var(--skeleton))" duration={0.3}>
            <section className="mt-4 text-center">
              <button
                className="text-sm text-primary hover:underline outline-none"
                type="button"
                onClick={goTo}
              >
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}
      </form>
    </section>
  );
});
