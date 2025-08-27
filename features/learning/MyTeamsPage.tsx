


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { getTeamsForStudent, getTeamsForMentor } from '../../services/mockApi';
import { Team, TeamStatus, UserRole } from '../../types';
import { Users, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const statusColorMap: Record<TeamStatus, string> = {
    'Planning': 'bg-yellow-500',
    'In Progress': 'bg-blue-500',
    'Completed': 'bg-green-500',
};

function MyTeamsPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            if (user) {
                setLoading(true);
                let data;
                if (user.role === UserRole.STUDENT) {
                    data = await getTeamsForStudent(user.id);
                } else if (user.role === UserRole.MENTOR) {
                    data = await getTeamsForMentor(user.name);
                }
                setTeams(data || []);
                setLoading(false);
            }
        };
        fetchTeams();
    }, [user]);

    const renderTeamCard = (team: Team) => (
        <Card 
            key={team.id} 
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            onClick={() => navigate(`/learning/teams/${team.id}`)}
        >
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>{team.project}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={cn("h-2 w-2 rounded-full", statusColorMap[team.status])}></span>
                        <span>{team.status}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center">
                    {team.members.slice(0, 7).map((member, index) => (
                        <img 
                            key={member.id} 
                            src={member.avatarUrl} 
                            alt={member.name} 
                            className="h-10 w-10 rounded-full border-2 border-background"
                            style={{ marginLeft: index > 0 ? '-12px' : 0, zIndex: team.members.length - index }}
                            title={member.name}
                        />
                    ))}
                    {team.members.length > 7 && (
                        <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-sm font-semibold" style={{ marginLeft: '-12px', zIndex: 0 }}>
                            +{team.members.length - 7}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="text-sm text-primary font-semibold flex items-center justify-end">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
            </CardFooter>
        </Card>
    );

    const renderEmptyState = () => (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <Users className="mx-auto h-16 w-16" />
            <h3 className="mt-4 text-xl font-semibold">{t('noTeamAssigned')}</h3>
            <p className="mt-2">Contact your administrator for team assignments.</p>
        </div>
    );

    const renderSkeletons = () => (
        <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-10 w-1/2" /></CardContent>
                    <CardFooter><Skeleton className="h-5 w-1/4 ml-auto" /></CardFooter>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('myTeams')}</h1>
                <p className="text-muted-foreground">Your collaborative projects and teams.</p>
            </div>
            
            {loading ? renderSkeletons() : (
                teams && teams.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                        {teams.map(renderTeamCard)}
                    </div>
                ) : renderEmptyState()
            )}
        </div>
    );
}

export default MyTeamsPage;