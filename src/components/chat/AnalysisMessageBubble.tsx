"use client";

import { AnalysisResult } from "@/api/types";
import { CheckCircle2 } from "lucide-react";

export function AnalysisMessageBubble({ analysisResult }: { analysisResult: AnalysisResult }) {
    if (!analysisResult) return null;

    return (
        <div className="space-y-4">
            {/* Risks */}
            {analysisResult.risks && analysisResult.risks.length > 0 && (
                <div>
                    <h4 className="body-semibold text-text-primary mb-3">Potential Risks</h4>
                    <div className="space-y-3">
                        {analysisResult.risks.map((risk, idx) => (
                            <div
                                key={idx}
                                className="bg-surface-white border border-gray-200 rounded-lg p-3"
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`caption font-bold px-2 py-0.5 rounded ${risk.severity === "HIGH"
                                                ? "bg-red-100 text-red-700"
                                                : risk.severity === "MEDIUM"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-green-100 text-green-700"
                                            }`}
                                    >
                                        {risk.severity}
                                    </span>
                                    <div className="flex-1">
                                        <p className="body-semibold text-text-primary">{risk.title}</p>
                                        <p className="body-small text-text-secondary mt-1">
                                            {risk.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Points */}
            {analysisResult.key_points && analysisResult.key_points.length > 0 && (
                <div>
                    <h4 className="body-semibold text-text-primary mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Key Points
                    </h4>
                    <ul className="space-y-2">
                        {analysisResult.key_points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-primary mt-1">•</span>
                                <span className="body-regular text-text-primary">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
