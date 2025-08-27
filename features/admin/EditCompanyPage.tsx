

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { getCompanyById, updateCompany, createCompany } from '../../services/mockApi';
import { Company } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';

const initialFormData = {
    name: '',
    industry: '',
    contactEmail: '',
};

function EditCompanyPage() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t } = useI18n();
    const { toast } = useToast();

    const isNewMode = !companyId;
    const isViewMode = pathname.endsWith('/view');

    const [company, setCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(!isNewMode);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (isNewMode) {
            setLoading(false);
            return;
        }

        const fetchCompany = async () => {
            if (companyId) {
                setLoading(true);
                const data = await getCompanyById(companyId);
                setCompany(data);
                if (data) {
                    setFormData({
                        name: data.name,
                        industry: data.industry,
                        contactEmail: data.contactEmail,
                    });
                }
                setLoading(false);
            }
        };
        fetchCompany();
    }, [companyId, isNewMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isNewMode) {
                await createCompany(formData);
                 toast({ title: "Success!", description: "Company created successfully.", variant: 'success' });
            } else {
                if (!companyId) return;
                await updateCompany(companyId, formData);
                toast({ title: "Success!", description: "Company information updated.", variant: 'success' });
            }
            navigate('/admin/companies');
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${isNewMode ? 'create' : 'update'} company.`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="space-y-4 p-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
    }

    if (!isNewMode && !company) {
        return <div className="p-8">Company not found.</div>
    }

    return (
        <div className="space-y-6">
            <Link to="/admin/companies" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Companies
            </Link>
             <form onSubmit={handleSubmit}>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>
                            {isNewMode ? t('addCompany') : isViewMode ? `${t('view')} Company` : t('editCompany')}
                        </CardTitle>
                        <CardDescription>
                            {isNewMode ? 'Enter details for the new company.' : isViewMode ? `Viewing details for ${company?.name}.` : `Update details for ${company?.name}.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">{t('companyName')}</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isViewMode} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">{t('industry')}</Label>
                            <Input id="industry" name="industry" value={formData.industry} onChange={handleChange} required disabled={isViewMode} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">{t('contactEmail')}</Label>
                            <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required disabled={isViewMode} />
                        </div>
                    </CardContent>
                    {!isViewMode && (
                        <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('cancel')}</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Spinner className="mr-2 h-4 w-4" />}
                                {t('save')}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </form>
        </div>
    );
}

export default EditCompanyPage;