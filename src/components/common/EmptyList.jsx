import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FILTER_CARD_CLASS } from "./FilterBar";
import { createPageUrl } from "@/utils";
export default function EmptyList({
  title,
  description,
  icon: Icon,
  actionIcon: ActionIcon,
  actionTitle,
  isArabic = false,
  navigationPath,
  btnClk,
  actions,
}) {
  return (
    <div className="border-2 border-slate-200 dark:border-0 shadow-sm bg-white dark:bg-gray-800 text-center p-16 rounded-lg">
      <Icon className="w-16 h-16 mx-auto text-slate-300 dark:text-gray-600 mb-4" />
      <p className="text-slate-600 mb-2  dark:text-slate-400">{title}</p>
      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actions}
      {btnClk && ActionIcon && actionTitle && (
        <div>
          <Button
            onClick={btnClk}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
          >
            <ActionIcon className="w-4 h-4 mr-2" />
            {actionTitle}
          </Button>
        </div>
      )}
      {!btnClk && ActionIcon && actionTitle && (
        <div>
          <Link to={createPageUrl(navigationPath)}>
            <Button
              onClick={btnClk}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
            >
              <ActionIcon className="w-4 h-4 mr-2" />
              {actionTitle}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
