import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, disabled = false, size = 22 }) {
  const [hover, setHover] = React.useState(null);
  const stars = [1, 2, 3, 4, 5];

  const current = hover != null ? hover : value;

  return (
    <div className="flex items-center gap-1">
      {stars.map((n) => {
        const filled = n <= current;
        return (
          <button
            key={n}
            type="button"
            className={`p-0.5 rounded ${disabled ? "cursor-default" : "cursor-pointer"}`}
            onMouseEnter={() => !disabled && setHover(n)}
            onMouseLeave={() => !disabled && setHover(null)}
            onClick={() => !disabled && onChange?.(n)}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            disabled={disabled}
          >
            <Star
              className={`${filled ? "text-yellow-400" : "text-slate-300"}`}
              style={{ width: size, height: size }}
              fill={filled ? "rgb(250 204 21)" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}