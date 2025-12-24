import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const FILTER_CARD_CLASS = "border-2 border-slate-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800";
export const SEARCH_INPUT_CLASS = "h-11 border-2 border-slate-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white";
export const SEARCH_WRAPPER_CLASS = "relative flex-1 min-w-[200px]";
export const SEARCH_ICON_CLASS = "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500";
export const SELECT_TRIGGER_CLASS = "h-11 border-2 border-slate-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-gray-700 dark:text-white";
export const FILTER_GRID_CLASS = "flex flex-wrap gap-4 items-center";

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  isArabic = false,
  className = "" 
}) {
  return (
    <div className={SEARCH_WRAPPER_CLASS}>
      <Search className={`${SEARCH_ICON_CLASS} ${isArabic ? 'right-3' : 'left-3'}`} />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${SEARCH_INPUT_CLASS} ${isArabic ? 'pr-10' : 'pl-10'} ${className}`}
      />
    </div>
  );
}

export default function FilterBar({ 
  children, 
  className = "" 
}) {
  return (
    <Card className={`${FILTER_CARD_CLASS} ${className}`}>
      <CardContent className="p-4">
        <div className={FILTER_GRID_CLASS}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
