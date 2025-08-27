

import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { useI18n } from '../../hooks/useI18n';
import SkillRadarChart from './components/SkillRadarChart';
import StudentProgress from './components/StudentProgress';
import { Button } from '../../components/ui/Button';
import { Download, ArrowLeft } from 'lucide-react';
import { getStudentById, getStudentSkillMap } from '../../services/mockApi';
import { Student, SkillMap } from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import MyTeamCard from './components/MyTeamCard';
import MyMatchedJobs from './components/MyMatchedJobs';
import { ProgressBar } from '../../components/ui/ProgressBar';

function StudentProfilePage(): React.ReactNode {
    const { t } = useI18n();
    const { studentId } = useParams();
    const { user } = useAuth();
    const location = useLocation();
    const fromJobId = location.state?.fromJobId;
    const [student, setStudent] = useState<Student | null>(null);
    const [skillMap, setSkillMap] = useState<SkillMap | null>(null);

    const isOwnProfile = user?.id === studentId;

    useEffect(() => {
        const fetchStudentData = async () => {
            if (studentId) {
                setStudent(null);
                setSkillMap(null);
                const studentData = await getStudentById(studentId);
                setStudent(studentData);
                const skillMapData = await getStudentSkillMap(studentId);
                setSkillMap(skillMapData);
            }
        };
        fetchStudentData();
    }, [studentId]);

    const renderHeader = () => (
        <div className="flex items-center justify-between">
            <div>
                {student ? (
                    <>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isOwnProfile ? `Welcome, ${student.name.split(' ')[0]}!` : student.name}
                        </h1>
                        <p className="text-muted-foreground">
                            {isOwnProfile ? "This is your personal dashboard." : t('studentProfileDesc')}
                        </p>
                    </>
                ) : (
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                )}
            </div>
             <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
            </Button>
        </div>
    );

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            {fromJobId ? (
                <Link
                    to={`/enterprise/jobs/${fromJobId}/matches`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('backToMatches')}
                </Link>
            ) : (
                 <Link
                    to="/learning/students"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Students
                </Link>
            )}

            {renderHeader()}
            
            <div className="grid gap-6 lg:grid-cols-3">
                 <Card className="shadow-lg lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('skillMap')}</CardTitle>
                        {!isOwnProfile && <CardDescription>{t('dynamicSkillMapDesc')}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                       {skillMap ? <SkillRadarChart data={skillMap} studentName={student?.name || 'Student'} /> : <Skeleton className="h-[400px]" />}
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>{t('overallProgress')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {student ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between font-semibold">
                                        <span>{student.course}</span>
                                        <span className="text-primary">{student.progress}%</span>
                                    </div>
                                    <ProgressBar value={student.progress} />
                                </div>
                            ) : <Skeleton className="h-10" />}
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>{t('taskProgress')}</CardTitle>
                            {!isOwnProfile && <CardDescription>Overview of assigned tasks and deadlines.</CardDescription>}
                        </CardHeader>
                        <CardContent>
                        {studentId ? <StudentProgress studentId={studentId} /> : <Skeleton className="h-[300px]" />}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isOwnProfile && studentId && (
                <div className="grid gap-6 lg:grid-cols-2 mt-6">
                    <MyTeamCard studentId={studentId} />
                    <MyMatchedJobs studentId={studentId} />
                </div>
            )}
        </div>
    );
}

export default StudentProfilePage;