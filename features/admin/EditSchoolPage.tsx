
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { getSchoolById, updateSchool, createSchool } from '../../services/mockApi';
import { School } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';

const initialFormData = {
    name: '',
    address: '',
    contactEmail: '',
    phone: '',
};

function EditSchoolPage() {
    const { schoolId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t } = useI18n();
    const { toast } = useToast();

    const isNewMode = !schoolId;
    const isViewMode = pathname.endsWith('/view');

    const [school, setSchool] = useState<School | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(!isNewMode);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (isNewMode) {
            setLoading(false);
            return;
        }

        const fetchSchool = async () => {
            if (schoolId) {
                setLoading(true);
                const data = await getSchoolById(schoolId);
                setSchool(data);
                if (data) {
                    setFormData({
                        name: data.name,
                        address: data.address,
                        contactEmail: data.contactEmail,
                        phone: data.phone || '',
                    });
                }
                setLoading(false);
            }
        };
        fetchSchool();
    }, [schoolId, isNewMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isNewMode) {
                await createSchool(formData);
                 toast({ title: "Success!", description: "School created successfully.", variant: 'success' });
            } else {
                if (!schoolId) return;
                await updateSchool(schoolId, formData);
                toast({ title: "Success!", description: "School information updated.", variant: 'success' });
            }
            navigate('/admin/schools');
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${isNewMode ? 'create' : 'update'} school.`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="space-y-4 p-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
    }

    if (!isNewMode && !school) {
        return <div className="p-8">School not found.</div>
    }

    return (
        <div className="space-y-6">
            <Link to="/admin/schools" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Schools
            </Link>
             <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isNewMode ? t('addSchool') : isViewMode ? `${t('view')} School` : t('editSchool')}
                        </CardTitle>
                        <CardDescription>
                            {isNewMode ? 'Enter details for the new school.' : isViewMode ? `Viewing details for ${school?.name}.` : `Update details for ${school?.name}.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">{t('schoolName')}</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isViewMode} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">{t('address')}</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} required disabled={isViewMode} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">{t('contactEmail')}</Label>
                                <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required disabled={isViewMode} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('phone')}</Label>
                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isViewMode} />
                            </div>
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

export default EditSchoolPage;
