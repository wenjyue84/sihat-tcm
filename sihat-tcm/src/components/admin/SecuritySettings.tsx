'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Shield, ShieldCheck, ShieldAlert, Check, Loader2, Info, Zap, Lock, UserCheck } from 'lucide-react'
import { logger } from '@/lib/clientLogger'

type SecurityLevel = 1 | 2 | 3;

interface SecurityConfig {
    level: SecurityLevel;
    rateLimitPerMinute: number;
    rateLimitPerDay: number;
    requireAuth: boolean;
    trackPerUser: boolean;
}

const DEFAULT_CONFIGS: Record<SecurityLevel, SecurityConfig> = {
    1: {
        level: 1,
        rateLimitPerMinute: 20,
        rateLimitPerDay: 500,
        requireAuth: false,
        trackPerUser: false,
    },
    2: {
        level: 2,
        rateLimitPerMinute: 30,
        rateLimitPerDay: 300,
        requireAuth: true,
        trackPerUser: false,
    },
    3: {
        level: 3,
        rateLimitPerMinute: 15,
        rateLimitPerDay: 100,
        requireAuth: true,
        trackPerUser: true,
    },
};

const LEVEL_INFO = {
    1: {
        title: 'Level 1: Basic Protection',
        subtitle: 'Rate limiting only',
        icon: Shield,
        color: 'blue',
        description: 'Limits requests per IP address. Best for development or low-traffic apps.',
        features: [
            '✓ Rate limiting per IP address',
            '✓ Daily request limits',
            '✗ No authentication required',
            '✗ No per-user tracking',
        ],
    },
    2: {
        title: 'Level 2: Standard Protection',
        subtitle: 'Rate limiting + Login required',
        icon: ShieldCheck,
        color: 'emerald',
        description: 'Requires user login to access AI features. Recommended for production.',
        features: [
            '✓ Rate limiting per IP address',
            '✓ Daily request limits',
            '✓ User authentication required',
            '✗ No per-user tracking',
        ],
    },
    3: {
        title: 'Level 3: Strict Protection',
        subtitle: 'Rate limiting + Login + Per-user limits',
        icon: ShieldAlert,
        color: 'amber',
        description: 'Strictest protection with per-user daily limits stored in database.',
        features: [
            '✓ Rate limiting per user',
            '✓ Per-user daily limits',
            '✓ User authentication required',
            '✓ Usage tracking per user',
        ],
    },
};

export function SecuritySettings() {
    const [config, setConfig] = useState<SecurityConfig>(DEFAULT_CONFIGS[1]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [customLimits, setCustomLimits] = useState(false);

    useEffect(() => {
        fetchSecurityConfig();
    }, []);

    const fetchSecurityConfig = async () => {
        try {
            const { data } = await supabase
                .from('system_prompts')
                .select('config')
                .eq('role', 'security_config')
                .single();

            if (data?.config) {
                setConfig(data.config as SecurityConfig);
                // Check if custom limits are set
                const defaultForLevel = DEFAULT_CONFIGS[data.config.level as SecurityLevel];
                if (
                    data.config.rateLimitPerMinute !== defaultForLevel.rateLimitPerMinute ||
                    data.config.rateLimitPerDay !== defaultForLevel.rateLimitPerDay
                ) {
                    setCustomLimits(true);
                }
            }
        } catch (error) {
            logger.info('SecuritySettings', 'No security config found, using defaults')
        } finally {
            setLoading(false);
        }
    };

    const handleLevelChange = (level: SecurityLevel) => {
        const baseConfig = DEFAULT_CONFIGS[level];
        if (customLimits) {
            // Keep custom limits but update other settings
            setConfig(prev => ({
                ...baseConfig,
                rateLimitPerMinute: prev.rateLimitPerMinute,
                rateLimitPerDay: prev.rateLimitPerDay,
            }));
        } else {
            setConfig(baseConfig);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Check if exists first
            const { data: existing } = await supabase
                .from('system_prompts')
                .select('id')
                .eq('role', 'security_config')
                .single();

            if (existing) {
                await supabase
                    .from('system_prompts')
                    .update({
                        config: config,
                        updated_at: new Date(),
                    })
                    .eq('role', 'security_config');
            } else {
                await supabase
                    .from('system_prompts')
                    .insert([{
                        role: 'security_config',
                        prompt_text: '',
                        config: config,
                    }]);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            logger.error('SecuritySettings', 'Error saving security config', error)
            alert('Failed to save security configuration.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetLimits = () => {
        const baseConfig = DEFAULT_CONFIGS[config.level];
        setConfig(baseConfig);
        setCustomLimits(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-300',
            ring: 'ring-blue-500',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
        },
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-300',
            ring: 'ring-emerald-500',
            icon: 'text-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-700',
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-300',
            ring: 'ring-amber-500',
            icon: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700',
        },
    };

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-slate-600" />
                        API Security Configuration
                    </CardTitle>
                    <CardDescription>
                        Protect your Gemini API from abuse by configuring rate limits and authentication requirements.
                        Changes take effect immediately.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Security Level Selection */}
            <div className="grid gap-4 md:grid-cols-3">
                {([1, 2, 3] as SecurityLevel[]).map((level) => {
                    const info = LEVEL_INFO[level];
                    const colors = colorClasses[info.color as keyof typeof colorClasses];
                    const isSelected = config.level === level;
                    const Icon = info.icon;

                    return (
                        <Card
                            key={level}
                            className={`cursor-pointer transition-all duration-200 ${isSelected
                                ? `${colors.border} border-2 ${colors.bg} ring-2 ${colors.ring} shadow-lg`
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                }`}
                            onClick={() => handleLevelChange(level)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Icon className={`w-8 h-8 ${isSelected ? colors.icon : 'text-slate-400'}`} />
                                    {isSelected && (
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.icon}`}>
                                            Active
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-lg mt-2">{info.title}</CardTitle>
                                <CardDescription className="font-medium">{info.subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                                <ul className="text-sm space-y-1">
                                    {info.features.map((feature, i) => (
                                        <li
                                            key={i}
                                            className={feature.startsWith('✓') ? 'text-emerald-600' : 'text-slate-400'}
                                        >
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Rate Limit Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Rate Limit Settings
                    </CardTitle>
                    <CardDescription>
                        Customize the rate limits for Level {config.level}. Leave at defaults for recommended settings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="perMinute" className="flex items-center gap-2">
                                Requests per Minute
                                <span className="text-xs text-muted-foreground">
                                    (Default: {DEFAULT_CONFIGS[config.level].rateLimitPerMinute})
                                </span>
                            </Label>
                            <Input
                                id="perMinute"
                                type="number"
                                min={1}
                                max={100}
                                value={config.rateLimitPerMinute}
                                onChange={(e) => {
                                    setConfig(prev => ({ ...prev, rateLimitPerMinute: parseInt(e.target.value) || 1 }));
                                    setCustomLimits(true);
                                }}
                                className="max-w-[200px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="perDay" className="flex items-center gap-2">
                                Requests per Day
                                <span className="text-xs text-muted-foreground">
                                    (Default: {DEFAULT_CONFIGS[config.level].rateLimitPerDay})
                                </span>
                            </Label>
                            <Input
                                id="perDay"
                                type="number"
                                min={1}
                                max={10000}
                                value={config.rateLimitPerDay}
                                onChange={(e) => {
                                    setConfig(prev => ({ ...prev, rateLimitPerDay: parseInt(e.target.value) || 1 }));
                                    setCustomLimits(true);
                                }}
                                className="max-w-[200px]"
                            />
                        </div>
                    </div>

                    {customLimits && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                            <Info className="w-4 h-4" />
                            Custom limits are set. Click "Reset to Defaults" to use recommended values.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Current Configuration Summary */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg">Current Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <Shield className={`w-5 h-5 ${colorClasses[LEVEL_INFO[config.level].color as keyof typeof colorClasses].icon}`} />
                            <div>
                                <p className="text-xs text-muted-foreground">Security Level</p>
                                <p className="font-semibold">Level {config.level}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-xs text-muted-foreground">Rate Limit</p>
                                <p className="font-semibold">{config.rateLimitPerMinute}/min</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <Lock className={`w-5 h-5 ${config.requireAuth ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <div>
                                <p className="text-xs text-muted-foreground">Authentication</p>
                                <p className="font-semibold">{config.requireAuth ? 'Required' : 'Not Required'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <UserCheck className={`w-5 h-5 ${config.trackPerUser ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <div>
                                <p className="text-xs text-muted-foreground">Per-User Tracking</p>
                                <p className="font-semibold">{config.trackPerUser ? 'Enabled' : 'Disabled'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="outline"
                    onClick={handleResetLimits}
                    disabled={!customLimits}
                    className="text-muted-foreground"
                >
                    Reset to Defaults
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 hover:bg-slate-800 min-w-[140px]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Saved!
                        </>
                    ) : (
                        'Save Configuration'
                    )}
                </Button>
            </div>

            {/* Protected Routes Info */}
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Protected API Routes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {[
                            '/api/chat',
                            '/api/report-chat',
                            '/api/consult',
                            '/api/analyze-image',
                            '/api/analyze-audio',
                            '/api/summarize-inquiry',
                            '/api/validate-medicine',
                            '/api/test-gemini',
                            '/api/extract-text',
                        ].map(route => (
                            <code
                                key={route}
                                className="text-xs bg-slate-100 px-2 py-1 rounded font-mono"
                            >
                                {route}
                            </code>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
