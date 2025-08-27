


import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { getTeamById, getTasksForTeam, deleteTeamTask, getStudents, updateTeam } from '../../services/mockApi';
import { Team, Student, TeamStatus, UserRole, TeamTask } from '../../types';
import { ArrowLeft, User, Briefcase, Users, CheckCircle, Clock, MoreHorizontal, UserPlus } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { useToast } from '../../hooks/useToast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../components/ui/DropdownMenu';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import TeamTasksList from './components/TeamTasksList';
import AssignTaskModal from './components/AssignTaskModal';
import MentorTeamTasksList from './components/MentorTeamTasksList';
import EvaluateMemberModal from './components/EvaluateMemberModal';

const statusInfoMap: Record<TeamStatus, { icon: React.ElementType, color: string }> = {
    'Planning': { icon: Clock, color: 'text-yellow-500' },
    'In Progress': { icon: Briefcase, color: 'text-blue-500' },
    'Completed': { icon: CheckCircle, color: 'text-green-500' },
};

function TeamDetailPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { teamId } = useParams();
    const [team, setTeam] = useState<Team | null>(null);
    const [teamTasks, setTeamTasks] = useState<TeamTask[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAssignTaskOpen, setAssignTaskOpen] = useState(false);
    const [evaluatingStudent, setEvaluatingStudent] = useState<Student | null>(null);
    const [allStudents, setAllStudents] = useState<Student[] | null>(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
    const [isManagingMembers, setIsManagingMembers] = useState(false);
    const [isSavingMembers, setIsSavingMembers] = useState(false);
    const { toast } = useToast();

    const fetchTeamData = async () => {
        if (teamId) {
            setLoading(true);
            const data = await getTeamById(teamId);
            setTeam(data);
             if (user?.role === UserRole.MENTOR || user?.role === UserRole.ADMIN) {
                const tasks = await getTasksForTeam(teamId);
                setTeamTasks(tasks);
            }
            // Fetch all students for member management (Mentor only)
            if (user?.role === UserRole.MENTOR) {
                const students = await getStudents();
                setAllStudents(students);
                // Initialize selected members
                if (data) {
                    setSelectedMemberIds(new Set(data.members.map(m => m.id)));
                }
            }
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTeamTask(taskId);
            await fetchTeamData(); // Refresh the tasks list
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleMemberToggle = (studentId: string) => {
        setSelectedMemberIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSaveMembers = async () => {
        if (!team || !teamId) return;
        
        setIsSavingMembers(true);
        try {
            const updatedTeam = {
                ...team,
                memberIds: Array.from(selectedMemberIds)
            };
            await updateTeam(teamId, updatedTeam);
            toast({ title: "Success", description: "Team members updated successfully.", variant: 'success' });
            setIsManagingMembers(false);
            await fetchTeamData(); // Refresh team data
        } catch (error) {
            toast({ title: "Error", description: "Failed to update team members.", variant: 'destructive' });
        } finally {
            setIsSavingMembers(false);
        }
    };

    const availableStudents = allStudents ? allStudents.filter(s => !s.teamIds?.length || s.teamIds.includes(teamId!)) : [];

    useEffect(() => {
        fetchTeamData();
    }, [teamId, user]);
    

    const renderMember = (member: Student) => (
        <li key={member.id} className="flex items-center gap-4 p-3 hover:bg-muted rounded-lg">
            <img src={member.avatarUrl} alt={member.name} className="h-12 w-12 rounded-full" />
            <div className="flex-1">
                <p className="font-semibold">{member.name} {member.id === team?.leader.id && <Badge variant="secondary" className="ml-2">Leader</Badge>}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
             {user?.role === UserRole.MENTOR && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEvaluatingStudent(member)}>
                            {t('evaluate')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </li>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-6 w-48" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!team) {
        return <div>Team not found.</div>;
    }
    
    const StatusIcon = statusInfoMap[team.status].icon;
    const statusColor = statusInfoMap[team.status].color;
    const backLink = (user?.role === UserRole.STUDENT || user?.role === UserRole.MENTOR) ? '/learning/my-teams' : '/learning/teams';

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <Link to={backLink} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Teams
                </Link>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                        <p className="text-muted-foreground">{t('teamDetails')}</p>
                    </div>
                     <div className="flex items-center gap-2">
                        {(user?.role === UserRole.MENTOR || user?.id === team?.leader.id) && (
                            <div className="flex items-center gap-2">
                                {user?.role === UserRole.MENTOR && <Button variant="outline" onClick={() => navigate(`/learning/teams/${team.id}/edit`)}>{t('editTeam')}</Button>}
                                <Button onClick={() => setAssignTaskOpen(true)}>{t('assignTask')}</Button>
                            </div>
                        )}
                        <div className={cn("flex items-center gap-2 font-semibold p-2 rounded-md bg-muted", statusColor)}>
                            <StatusIcon className="h-5 w-5"/>
                            <span>{team.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle>{t('projectDetails')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Project Name</h3>
                                <p className="text-muted-foreground text-xl ml-7">{team.project}</p>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> {t('mentor')}</h3>
                                <p className="text-muted-foreground text-xl ml-7">{team.mentor}</p>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Project Description</h3>
                                <p className="text-muted-foreground">{team.projectDescription}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                     <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6" /> {t('members')} ({team.members.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 max-h-96 overflow-y-auto">
                               {team.members.map(renderMember)}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {user?.role === UserRole.STUDENT && teamId && (
                <TeamTasksList teamId={teamId} studentId={user.id} />
            )}
            
            {(user?.role === UserRole.MENTOR || user?.role === UserRole.ADMIN) && teamTasks && (
                <MentorTeamTasksList tasks={teamTasks} onDeleteTask={handleDeleteTask} />
            )}
            
            {/* Manage Members Section - Only for Mentor */}
            {user?.role === UserRole.MENTOR && team && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="h-6 w-6" /> 
                                {t('manageMembers')}
                            </CardTitle>
                            {!isManagingMembers && (
                                <Button onClick={() => setIsManagingMembers(true)} variant="outline">
                                    Edit Members
                                </Button>
                            )}
                        </div>
                        <CardDescription>
                            {isManagingMembers ? 'Add or remove students from this team.' : 'Current team members and management options.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isManagingMembers ? (
                            <div className="space-y-4">
                                <div className="max-h-80 overflow-y-auto space-y-2 rounded-md border p-4">
                                    {availableStudents.length > 0 ? (
                                        availableStudents.map(student => (
                                            <div key={student.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                                <input
                                                    type="checkbox"
                                                    id={`student-member-${student.id}`}
                                                    checked={selectedMemberIds.has(student.id)}
                                                    onChange={() => handleMemberToggle(student.id)}
                                                    className="h-4 w-4"
                                                />
                                                <label htmlFor={`student-member-${student.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                                                    <img src={student.avatarUrl} alt={student.name} className="h-8 w-8 rounded-full" />
                                                    <div>
                                                        <p className="font-medium text-sm">{student.name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.course}</p>
                                                    </div>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-muted-foreground p-4">No available students found.</p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => {
                                            setIsManagingMembers(false);
                                            setSelectedMemberIds(new Set(team.members.map(m => m.id)));
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleSaveMembers}
                                        disabled={isSavingMembers || selectedMemberIds.size === 0}
                                    >
                                        {isSavingMembers ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                Team members are managed through the edit interface above.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            
            {team && (
                <AssignTaskModal
                    isOpen={isAssignTaskOpen}
                    onClose={() => setAssignTaskOpen(false)}
                    team={team}
                />
            )}

            {evaluatingStudent && (
                <EvaluateMemberModal
                    isOpen={!!evaluatingStudent}
                    onClose={() => setEvaluatingStudent(null)}
                    student={evaluatingStudent}
                    onSuccess={() => {
                        fetchTeamData();
                        setEvaluatingStudent(null);
                    }}
                />
            )}
        </div>
    );
}

export default TeamDetailPage;