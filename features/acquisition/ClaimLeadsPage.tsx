


import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getUnassignedLeads, claimLead } from '../../services/mockApi';
import { Lead } from '../../types';
import UnassignedLeadsTable from './components/UnassignedLeadsTable';
import { Handshake } from 'lucide-react';

type SortDirection = 'ascending' | 'descending';
type SortConfig = { key: keyof Lead; direction: SortDirection };

function ClaimLeadsPage(): React.ReactNode {
    const { t } = useI18n();
    const { user } = useAuth();
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[] | null>(null);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'score', direction: 'descending' });

    useEffect(() => {
        const fetchLeads = async () => {
            const data = await getUnassignedLeads();
            setLeads(data);
        };
        fetchLeads();
    }, []);
    
    const sortedLeads = useMemo(() => {
        if (!leads) return null;
        const sortableItems = [...leads];
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [leads, sortConfig]);

    const requestSort = (key: keyof Lead) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleClaim = async (lead: Lead) => {
        if (!user) return;
        setClaimingId(lead.id);
        try {
            await claimLead(lead.id, user);
            toast({
                title: 'Success!',
                description: t('leadClaimedSuccess', { leadName: lead.name }),
                variant: 'success'
            });
            setLeads(prev => prev!.filter(l => l.id !== lead.id));
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to claim lead.',
                variant: 'destructive'
            });
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="space-y-6 bg-gradient-to-br from-white to-gray-300">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('unassignedLeads')}</h1>
                <p className="text-muted-foreground">{t('unassignedLeadsDesc')}</p>
            </div>
            
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    {leads && leads.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Handshake className="mx-auto h-16 w-16" />
                            <h3 className="mt-4 text-xl font-semibold">{t('noUnassignedLeads')}</h3>
                        </div>
                    ) : (
                        <UnassignedLeadsTable leads={sortedLeads} onClaim={handleClaim} claimingId={claimingId} requestSort={requestSort} sortConfig={sortConfig} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ClaimLeadsPage;