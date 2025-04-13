import React, { forwardRef } from "react";
import InputMask from "react-input-mask";
import { Input } from "@/components/ui/input";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <InputMask
        mask="+7 (999) 999-99-99"
        value={value}
        onChange={onChange}
        maskChar="_"
      >
        {(inputProps: any) => (
          <Input
            ref={ref}
            type="tel"
            className={className}
            placeholder="+7 (___) ___-__-__"
            {...inputProps}
            {...props}
          />
        )}
      </InputMask>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput }; 