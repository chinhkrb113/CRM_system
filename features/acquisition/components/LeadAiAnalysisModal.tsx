
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Lead } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface LeadAiAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
}

function LeadAiAnalysisModal({ isOpen, onClose, lead }: LeadAiAnalysisModalProps) {
    const { t } = useI18n();
    const analysis = lead.aiAnalysis;

    if (!isOpen || !analysis) return null;

    const score = Math.round(analysis.score * 100);
    const positiveFeatures = analysis.topFeatures.filter(f => f.impact === 'positive');
    const negativeFeatures = analysis.topFeatures.filter(f => f.impact === 'negative');
    
    const getScoreColor = () => {
        if (score > 75) return 'text-green-500';
        if (score > 50) return 'text-sky-500';
        if (score > 25) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{t('aiLeadScoreAnalysis')}</DialogTitle>
                <DialogDescription>Analysis for lead: {lead.name}</DialogDescription>
            </DialogHeader>
            <DialogContent className="max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                         <div className={`text-6xl font-bold ${getScoreColor()}`}>{score}</div>
                         <div className="text-sm text-muted-foreground font-semibold">LEAD SCORE</div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <h3 className="font-semibold text-base flex items-center gap-2 text-green-600 dark:text-green-500">
                                <TrendingUp className="h-5 w-5" />
                                {t('positiveFactors')}
                            </h3>
                            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                                {positiveFeatures.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                                        <span>{item.feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-base flex items-center gap-2 text-red-600 dark:text-red-500">
                                <TrendingDown className="h-5 w-5" />
                                {t('negativeFactors')}
                            </h3>
                            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                                {negativeFeatures.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                                        <span>{item.feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Close</Button>
            </DialogFooter>
        </Dialog>
    );
}
export default LeadAiAnalysisModal;