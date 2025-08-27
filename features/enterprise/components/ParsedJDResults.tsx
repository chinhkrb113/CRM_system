
import React from 'react';
import { ParsedJd } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useI18n } from '../../../hooks/useI18n';

interface ParsedJDResultsProps {
    data: ParsedJd;
}

function ParsedJDResults({ data }: ParsedJDResultsProps) {
    const { t } = useI18n();

    const formatExperience = (exp: ParsedJd['experienceYears']) => {
        if (!exp || (exp.min === undefined && exp.max === undefined)) return 'Not specified';
        if (exp.min && exp.max) {
            if (exp.min === exp.max) return `${exp.min} ${t('years')}`;
            return `${exp.min}-${exp.max} ${t('years')}`;
        }
        if (exp.min) return `${exp.min}+ ${t('years')}`;
        if (exp.max) return `Up to ${exp.max} ${t('years')}`;
        return 'Not specified';
    };

    return (
        <Card className="shadow-lg mt-6 animate-in fade-in-50 duration-500">
            <CardHeader>
                <CardTitle>{t('jdParsingResults')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.skills && data.skills.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">{t('requiredSkills')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                {data.softSkills && data.softSkills.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">{t('softSkills')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.softSkills.map((skill, index) => (
                                <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <h4 className="font-semibold">{t('experience')}</h4>
                        <p className="text-lg font-medium text-primary">{formatExperience(data.experienceYears)}</p>
                    </div>
                    {data.hiddenRequirements && data.hiddenRequirements.length > 0 && (
                         <div className="space-y-2">
                            <h4 className="font-semibold">{t('hiddenRequirements')}</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {data.hiddenRequirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default ParsedJDResults;