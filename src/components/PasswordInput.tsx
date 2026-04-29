import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showStrengthIndicator?: boolean;
}

const PasswordInput = ({
  value,
  onChange,
  placeholder = "Contraseña",
  className,
  showStrengthIndicator = true
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    return {
      score,
      checks,
      strength: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong',
      color: score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
    };
  };

  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pr-10", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {showStrengthIndicator && value && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  level <= strength.score ? strength.color : "bg-muted"
                )}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={cn("flex items-center gap-1", strength.checks.length ? "text-green-600" : "text-muted-foreground")}>
              {strength.checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              8+ caracteres
            </div>
            <div className={cn("flex items-center gap-1", strength.checks.uppercase ? "text-green-600" : "text-muted-foreground")}>
              {strength.checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Mayúscula
            </div>
            <div className={cn("flex items-center gap-1", strength.checks.lowercase ? "text-green-600" : "text-muted-foreground")}>
              {strength.checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Minúscula
            </div>
            <div className={cn("flex items-center gap-1", strength.checks.numbers ? "text-green-600" : "text-muted-foreground")}>
              {strength.checks.numbers ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Número
            </div>
            <div className={cn("flex items-center gap-1", strength.checks.special ? "text-green-600" : "text-muted-foreground")}>
              {strength.checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Carácter especial
            </div>
          </div>

          <p className={cn(
            "text-xs",
            strength.strength === 'weak' && "text-red-600",
            strength.strength === 'medium' && "text-yellow-600",
            strength.strength === 'strong' && "text-green-600"
          )}>
            Fortaleza: {strength.strength === 'weak' ? 'Débil' : strength.strength === 'medium' ? 'Media' : 'Fuerte'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;