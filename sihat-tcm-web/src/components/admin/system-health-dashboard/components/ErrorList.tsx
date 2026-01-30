"use client";

import { useState } from "react";
import { Clock, Users, Globe, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { SeverityBadge } from "./SeverityBadge";
import type { SystemError } from "@/types/monitoring";

interface ErrorListProps {
  errors: SystemError[];
  showResolved?: boolean;
  onToggleResolved?: (errorId: string) => void;
}

export function ErrorList({ errors, showResolved = false, onToggleResolved }: ErrorListProps) {
  const [showStackTrace, setShowStackTrace] = useState<Record<string, boolean>>({});

  const toggleStackTrace = (errorId: string) => {
    setShowStackTrace((prev) => ({
      ...prev,
      [errorId]: !prev[errorId],
    }));
  };

  const filteredErrors = showResolved ? errors : errors.filter((error) => !error.resolved);

  if (filteredErrors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <p>No {showResolved ? "" : "unresolved "}errors found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredErrors.map((error) => (
        <Card key={error.id} className={error.resolved ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <SeverityBadge severity={error.severity} />
                  <Badge variant="outline" className="text-xs">
                    {error.error_type}
                  </Badge>
                  {error.component && (
                    <Badge variant="secondary" className="text-xs">
                      {error.component}
                    </Badge>
                  )}
                  {error.resolved && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Resolved</Badge>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-900 mb-1">{error.message}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                  </span>
                  {error.user_id && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      User: {error.user_id.slice(0, 8)}...
                    </span>
                  )}
                  {error.url && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {new URL(error.url).pathname}
                    </span>
                  )}
                </div>

                {error.stack_trace && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStackTrace(error.id)}
                      className="h-6 px-2 text-xs"
                    >
                      {showStackTrace[error.id] ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hide Stack Trace
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Show Stack Trace
                        </>
                      )}
                    </Button>

                    {showStackTrace[error.id] && (
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                        {error.stack_trace}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {onToggleResolved && (
                  <Button
                    variant={error.resolved ? "secondary" : "default"}
                    size="sm"
                    onClick={() => onToggleResolved(error.id)}
                    className="text-xs"
                  >
                    {error.resolved ? "Mark Unresolved" : "Mark Resolved"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
