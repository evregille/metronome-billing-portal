import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
  };
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
  }
>(({ className, config, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full", className)}
    style={
      {
        "--chart-1": "hsl(12, 76%, 61%)",
        "--chart-2": "hsl(173, 58%, 39%)",
        "--chart-3": "hsl(197, 37%, 24%)",
        "--chart-4": "hsl(43, 74%, 66%)",
        "--chart-5": "hsl(27, 87%, 67%)",
        ...config,
      } as React.CSSProperties
    }
    {...props}
  />
));
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid min-w-[8rem] items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-md",
      className,
    )}
    {...props}
  />
));
ChartTooltip.displayName = "ChartTooltip";

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  indicator?: "line" | "dot";
  labelFormatter?: (value: string) => string;
  formatter?: (value: number, name: string) => [string, string];
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ className, active, payload, label, indicator = "dot", labelFormatter, formatter, ...props }, ref) => {
    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn("grid min-w-[8rem] items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-md", className)}
        {...props}
      >
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            {indicator === "dot" && (
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: payload[0]?.color }}
              />
            )}
            <span className="text-muted-foreground">
              {labelFormatter ? labelFormatter(label || "") : label}
            </span>
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              {indicator === "line" && (
                <div
                  className="h-0.5 w-3"
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent };
