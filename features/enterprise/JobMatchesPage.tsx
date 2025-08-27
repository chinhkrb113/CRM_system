


import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJobById, getMatchingStudents } from '../../services/mockApi';
import { JobPosting, MatchingCandidate, ParsedJd } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { Skeleton } from '../../components/ui/Skeleton';
import MatchingResults from './components/MatchingResults';
import ParsedJDResults from './components/ParsedJDResults';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function JobMatchesPage(): React.ReactNode {
    const { t } = useI18n();
    const { jobId } = useParams();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [parsedData, setParsedData] = useState<ParsedJd | null>(null);
    const [candidates, setCandidates] = useState<MatchingCandidate[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndProcessJob = async () => {
            if (!jobId) return;
            setLoading(true);
            setError(null);
            setJob(null);
            setParsedData(null);
            setCandidates(null);
            
            try {
                // 1. Fetch Job Data
                const jobData = await getJobById(jobId);
                setJob(jobData);

                if (!jobData || !jobData.description) {
                    throw new Error("Job not found or has no description.");
                }

                // 2. Parse JD with Gemini AI
                 const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Parse the job description provided and extract the requested information.\n\n${jobData.description}`,
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
                                        min: { type: Type.INTEGER, description: 'The minimum years of experience.'},
                                        max: { type: Type.INTEGER, description: 'The maximum years of experience.'},
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

                // 3. Find Matching Students
                const candidateData = await getMatchingStudents(data);
                setCandidates(candidateData);

            } catch (e) {
                console.error("Error processing job matches:", e);
                setError("Failed to process job description and find matches. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchAndProcessJob();
    }, [jobId]);
    
    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
             <div>
                <Link to="/enterprise/jobs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Job Postings
                </Link>
                {(loading || !job) ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold tracking-tight">{t('matchingCandidates')}</h1>
                        <p className="text-muted-foreground">Top matches for "{job.title}" at {job.companyName}</p>
                    </>
                )}
            </div>
            
            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <>
                    {parsedData && <ParsedJDResults data={parsedData} />}
                    {candidates && <MatchingResults candidates={candidates} job={job} />}
                </>
            )}

        </div>
    );
}

export default JobMatchesPage;