import React from "react";
import { HelpCircle, Info, Lightbulb } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ContextualTooltip({ 
  content, 
  title, 
  side = "top", 
  variant = "default",
  className = "" 
}) {
  const icons = {
    default: HelpCircle,
    info: Info,
    tip: Lightbulb
  };

  const Icon = icons[variant] || HelpCircle;

  const variantStyles = {
    default: "bg-slate-100 hover:bg-slate-200 text-slate-600",
    info: "bg-blue-100 hover:bg-blue-200 text-blue-600",
    tip: "bg-purple-100 hover:bg-purple-200 text-purple-600"
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-all ${variantStyles[variant]} ${className}`}
          aria-label="Help"
        >
          <Icon className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-80 p-4 shadow-xl border-2">
        {title && (
          <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </h4>
        )}
        <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  );
}