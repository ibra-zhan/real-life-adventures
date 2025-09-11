import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
}

export function FilterDropdown({
  options,
  selectedValues,
  onSelectionChange,
  label = "Filter",
  placeholder = "Select filters",
  multiple = true,
  className
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionToggle = (value: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newValues);
    } else {
      onSelectionChange([value]);
      setIsOpen(false);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedValues.length;
  const hasSelection = selectedCount > 0;

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={hasSelection ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2",
              hasSelection && "bg-primary text-primary-foreground"
            )}
          >
            <Filter className="w-4 h-4" />
            {hasSelection ? (
              <span>{label} ({selectedCount})</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{label}</span>
            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleOptionToggle(option.value)}
              className="flex items-center justify-between"
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {option.count}
                </Badge>
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected filters display */}
      {hasSelection && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map((value) => {
            const option = options.find(opt => opt.value === value);
            return (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {option?.label || value}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOptionToggle(value)}
                  className="h-4 w-4 p-0 hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
