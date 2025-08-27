
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../hooks/useI18n';
import { ParsedJd, MatchingCandidate } from '../../types';
import ParsedJDResults from './components/ParsedJDResults';
import MatchingResults from './components/MatchingResults';
import { Spinner } from '../../components/ui/Spinner';
import { AlertTriangle } from 'lucide-react';
import { getMatchingStudents } from '../../services/mockApi';
import { Skeleton } from '../../components/ui/Skeleton';

// Initialize the client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function JDParserPage(): React.ReactNode {
    const { t } = useI18n();
    const [jdText, setJdText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedJd | null>(null);
    const [matchingResults, setMatchingResults] = useState<MatchingCandidate[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleParseAndMatch = async () => {
        if (!jdText.trim()) return;

        setIsParsing(true);
        setIsMatching(false);
        setError(null);
        setParsedData(null);
        setMatchingResults(null);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Parse the job description provided and extract the requested information.\n\n${jdText}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            skills: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "List of technical skills, programming languages, and tools required.",
                            },
                            softSkills: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "List of soft skills like communication, teamwork, etc.",
                            },
                            experienceYears: {
                                type: Type.OBJECT,
                                description: "Minimum and maximum years of experience required. Omit properties if not specified.",
                                properties: {
                                    min: { 
                                        type: Type.INTEGER,
                                        description: 'The minimum years of experience.',
                                    },
                                    max: { 
                                        type: Type.INTEGER,
                                        description: 'The maximum years of experience.',
                                    },
                                },
                            },
                            hiddenRequirements: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "Implicit or 'hidden' requirements inferred from the text, like culture fit, specific industry knowledge, etc.",
                            },
                        },
                    },
                },
            });

            let jsonStr = response.text.trim();
            if (jsonStr.startsWith("```json")) {
                jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
            } else if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.substring(3, jsonStr.length - 3).trim();
            }
            
            const data: ParsedJd = JSON.parse(jsonStr);
            setParsedData(data);
            setIsParsing(false);

            setIsMatching(true);
            const candidates = await getMatchingStudents(data);
            setMatchingResults(candidates);

        } catch (e) {
            console.error("Error during parse/match:", e);
            setError(t('jdParseError'));
        } finally {
            setIsParsing(false);
            setIsMatching(false);
        }
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <h1 className="text-3xl font-bold tracking-tight">{t('jdParserTitle')}</h1>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>{t('jdParserTitle')}</CardTitle>
                    <CardDescription>{t('jdParserDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <textarea 
                        className="w-full h-64 p-4 border rounded-md bg-muted font-mono text-sm"
                        placeholder={t('pasteJDPlaceholder')}
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        disabled={isParsing || isMatching}
                    ></textarea>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Button onClick={handleParseAndMatch} disabled={isParsing || isMatching || !jdText.trim()}>
                             {isParsing ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {t('parsing')}
                                </>
                            ) : isMatching ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {t('findingMatches')}
                                </>
                            ) : t('parseAndMatch')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {parsedData && <ParsedJDResults data={parsedData} />}
            
            {isMatching && (
                <Card className="shadow-lg mt-6">
                    <CardHeader><CardTitle>{t('matchingCandidates')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {matchingResults && !isMatching && <MatchingResults candidates={matchingResults} />}
        </div>
    );
}

export default JDParserPage;