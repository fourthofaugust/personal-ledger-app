'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(({ length = 6, value = "", onChange, onComplete, className, ...props }, ref) => {
  const [otp, setOtp] = React.useState(Array(length).fill(""));
  const inputRefs = React.useRef([]);

  React.useEffect(() => {
    if (value) {
      setOtp(value.split("").concat(Array(length).fill("")).slice(0, length));
    } else {
      setOtp(Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    const otpString = newOtp.join("");
    onChange?.(otpString);

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (otpString.length === length && newOtp.every(digit => digit !== "")) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("").concat(Array(length).fill("")).slice(0, length);
    setOtp(newOtp);
    onChange?.(pastedData);

    if (pastedData.length === length) {
      onComplete?.(pastedData);
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)} {...props}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "h-14 w-14 text-center text-xl font-semibold rounded-md border border-input bg-background",
            "focus:border-ring focus:ring-ring/50 focus:ring-2 focus:outline-none",
            "transition-all"
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
});

InputOTP.displayName = "InputOTP";

export { InputOTP };
