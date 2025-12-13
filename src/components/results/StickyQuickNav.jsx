import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function StickyQuickNav({ sections = [], onJump, onPrint, isArabic = false }) {
  return (
    <div className="hidden lg:block no-print sticky top-24">
      <Card className="glass-effect border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-800 text-base">
            {isArabic ? "التنقل السريع" : "Quick Navigation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                onClick={() => onJump?.(id)}
                className={`w-full justify-start gap-2 ${isArabic ? 'flex-row-reverse text-right' : ''}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="truncate">{label}</span>
              </Button>
            ))}
          </div>

          <div className="pt-2">
            <Button onClick={onPrint} className="w-full gradient-primary text-white gap-2">
              <Printer className="w-4 h-4" />
              {isArabic ? "طباعة PDF" : "Print PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}