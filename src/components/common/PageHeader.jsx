import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  description,
  icon: Icon,
  backUrl,
  onBack,
  actions,
  className = "",
  titleClassName = "",
  isArabic = false,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        {(backUrl || onBack) && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="shadow-sm border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all flex-shrink-0"
          >
            <ArrowLeft
              className={`w-4 h-4 text-purple-600 ${
                isArabic ? "rotate-180" : ""
              }`}
            />
          </Button>
        )}

        {Icon && (
          <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        )}

        <div>
          <h1
            className={`text-2xl md:text-3xl font-bold text-orange-500 ${titleClassName}`}
          >
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
