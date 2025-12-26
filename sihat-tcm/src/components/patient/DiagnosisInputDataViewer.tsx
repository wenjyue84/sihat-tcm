'use client'

import { Card } from '@/components/ui/card'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { 
    MessageSquare, 
    Camera, 
    Mic, 
    Heart, 
    FileText, 
    Image as ImageIcon,
    File,
    Download
} from 'lucide-react'
import type { DiagnosisSession } from '@/types/database'

interface DiagnosisInputDataViewerProps {
    session: DiagnosisSession
}

export function DiagnosisInputDataViewer({ session }: DiagnosisInputDataViewerProps) {

    const hasInputData = 
        session.inquiry_summary || 
        session.inquiry_chat_history?.length ||
        session.inquiry_report_files?.length ||
        session.inquiry_medicine_files?.length ||
        session.tongue_analysis ||
        session.face_analysis ||
        session.body_analysis ||
        session.audio_analysis ||
        session.pulse_data

    if (!hasInputData) {
        return null
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Input Data</h2>

            {/* Inquiry Data */}
            {(session.inquiry_summary || session.inquiry_chat_history?.length || 
              session.inquiry_report_files?.length || session.inquiry_medicine_files?.length) && (
                <CollapsibleSection
                    title="Inquiry & Conversation"
                    icon={MessageSquare}
                    accentColor="blue"
                    defaultOpen={false}
                >
                    <div className="p-4 space-y-4">
                        {session.inquiry_summary && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Summary</h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                                    {session.inquiry_summary}
                                </p>
                            </div>
                        )}
                        
                        {session.inquiry_chat_history && session.inquiry_chat_history.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Chat History</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {session.inquiry_chat_history.map((msg, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`p-3 rounded-lg ${
                                                msg.role === 'user' 
                                                    ? 'bg-blue-50 border border-blue-100' 
                                                    : 'bg-slate-50 border border-slate-100'
                                            }`}
                                        >
                                            <div className="text-xs font-medium text-slate-500 mb-1">
                                                {msg.role === 'user' ? 'You' : 'AI Doctor'}
                                                {msg.timestamp && (
                                                    <span className="ml-2 text-slate-400">
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-700">{msg.content}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {session.inquiry_report_files && session.inquiry_report_files.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Medical Reports</h4>
                                <div className="space-y-2">
                                    {session.inquiry_report_files.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                {file.size && (
                                                    <p className="text-xs text-slate-500">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </p>
                                                )}
                                            </div>
                                            {file.url && (
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {session.inquiry_medicine_files && session.inquiry_medicine_files.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Medicine Files</h4>
                                <div className="space-y-2">
                                    {session.inquiry_medicine_files.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <File className="w-5 h-5 text-purple-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                                                {file.extracted_text && (
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {file.extracted_text}
                                                    </p>
                                                )}
                                            </div>
                                            {file.url && (
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Tongue Analysis */}
            {session.tongue_analysis && (
                <CollapsibleSection
                    title="Tongue Analysis"
                    icon={ImageIcon}
                    accentColor="red"
                    defaultOpen={false}
                >
                    <div className="p-4 space-y-4">
                        {session.tongue_analysis.image_url && (
                            <div>
                                <img 
                                    src={session.tongue_analysis.image_url} 
                                    alt="Tongue image" 
                                    className="max-w-full h-auto rounded-lg border border-slate-200 shadow-sm"
                                />
                            </div>
                        )}
                        {session.tongue_analysis.observation && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Observation</h4>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    {session.tongue_analysis.observation}
                                </p>
                            </div>
                        )}
                        {session.tongue_analysis.tcm_indicators && session.tongue_analysis.tcm_indicators.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">TCM Indicators</h4>
                                <div className="flex flex-wrap gap-2">
                                    {session.tongue_analysis.tcm_indicators.map((indicator, idx) => (
                                        <span 
                                            key={idx} 
                                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                                        >
                                            {indicator}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {session.tongue_analysis.pattern_suggestions && session.tongue_analysis.pattern_suggestions.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Pattern Suggestions</h4>
                                <div className="flex flex-wrap gap-2">
                                    {session.tongue_analysis.pattern_suggestions.map((pattern, idx) => (
                                        <span 
                                            key={idx} 
                                            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
                                        >
                                            {pattern}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {session.tongue_analysis.potential_issues && session.tongue_analysis.potential_issues.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Potential Issues</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                                    {session.tongue_analysis.potential_issues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Face Analysis */}
            {session.face_analysis && (
                <CollapsibleSection
                    title="Face Analysis"
                    icon={Camera}
                    accentColor="purple"
                    defaultOpen={false}
                >
                    <div className="p-4 space-y-4">
                        {session.face_analysis.image_url && (
                            <div>
                                <img 
                                    src={session.face_analysis.image_url} 
                                    alt="Face image" 
                                    className="max-w-full h-auto rounded-lg border border-slate-200 shadow-sm"
                                />
                            </div>
                        )}
                        {session.face_analysis.observation && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Observation</h4>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    {session.face_analysis.observation}
                                </p>
                            </div>
                        )}
                        {session.face_analysis.tcm_indicators && session.face_analysis.tcm_indicators.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">TCM Indicators</h4>
                                <div className="flex flex-wrap gap-2">
                                    {session.face_analysis.tcm_indicators.map((indicator, idx) => (
                                        <span 
                                            key={idx} 
                                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                                        >
                                            {indicator}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {session.face_analysis.potential_issues && session.face_analysis.potential_issues.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Potential Issues</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                                    {session.face_analysis.potential_issues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Body Analysis */}
            {session.body_analysis && (
                <CollapsibleSection
                    title="Body Part Analysis"
                    icon={ImageIcon}
                    accentColor="indigo"
                    defaultOpen={false}
                >
                    <div className="p-4 space-y-4">
                        {session.body_analysis.image_url && (
                            <div>
                                <img 
                                    src={session.body_analysis.image_url} 
                                    alt="Body part image" 
                                    className="max-w-full h-auto rounded-lg border border-slate-200 shadow-sm"
                                />
                            </div>
                        )}
                        {session.body_analysis.observation && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Observation</h4>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    {session.body_analysis.observation}
                                </p>
                            </div>
                        )}
                        {session.body_analysis.potential_issues && session.body_analysis.potential_issues.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Potential Issues</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                                    {session.body_analysis.potential_issues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Audio Analysis */}
            {session.audio_analysis && (
                <CollapsibleSection
                    title="Voice Analysis"
                    icon={Mic}
                    accentColor="teal"
                    defaultOpen={false}
                >
                    <div className="p-4 space-y-4">
                        {session.audio_analysis.audio_url && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Audio Recording</h4>
                                <audio 
                                    controls 
                                    src={session.audio_analysis.audio_url} 
                                    className="w-full"
                                >
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                        {session.audio_analysis.observation && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Observation</h4>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    {session.audio_analysis.observation}
                                </p>
                            </div>
                        )}
                        {session.audio_analysis.potential_issues && session.audio_analysis.potential_issues.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Potential Issues</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                                    {session.audio_analysis.potential_issues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            {/* Pulse Data */}
            {session.pulse_data && (
                <CollapsibleSection
                    title="Pulse Measurement"
                    icon={Heart}
                    accentColor="rose"
                    defaultOpen={false}
                >
                    <div className="p-4 space-y-3">
                        {session.pulse_data.bpm !== undefined && session.pulse_data.bpm !== null && (
                            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                                <Heart className="w-6 h-6 text-rose-600" />
                                <div>
                                    <span className="text-sm font-medium text-slate-600">BPM:</span>
                                    <span className="text-2xl font-bold text-rose-600 ml-2">
                                        {session.pulse_data.bpm}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            {session.pulse_data.quality && (
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-medium text-slate-500 block mb-1">Quality</span>
                                    <span className="text-sm font-semibold text-slate-700">{session.pulse_data.quality}</span>
                                </div>
                            )}
                            {session.pulse_data.rhythm && (
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-medium text-slate-500 block mb-1">Rhythm</span>
                                    <span className="text-sm font-semibold text-slate-700">{session.pulse_data.rhythm}</span>
                                </div>
                            )}
                            {session.pulse_data.strength && (
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-xs font-medium text-slate-500 block mb-1">Strength</span>
                                    <span className="text-sm font-semibold text-slate-700">{session.pulse_data.strength}</span>
                                </div>
                            )}
                        </div>
                        {session.pulse_data.notes && (
                            <div>
                                <h4 className="font-medium mb-2 text-slate-700">Notes</h4>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                    {session.pulse_data.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}
        </div>
    )
}

