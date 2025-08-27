import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { getUserById, updateUser, createAgent } from '../../services/mockApi';
import { User } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import { Select } from '../../components/ui/Select';

const initialFormData = {
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: undefined as User['gender'],
    contactAddress: '',
    permanentAddress: '',
    nationalId: '',
    nationalIdPhotoUrl: '',
    idIssueDate: '',
    idIssuePlace: '',
    avatarUrl: '',
};

function EditAgentPage() {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { t } = useI18n();
    const { toast } = useToast();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const isNewMode = !agentId;
    const isViewMode = pathname.endsWith('/view');

    const [agent, setAgent] = useState<User | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(!isNewMode);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchAgent = async () => {
            if (!isNewMode && agentId) {
                setLoading(true);
                const data = await getUserById(agentId);
                setAgent(data);
                if (data) {
                    setFormData({
                        name: data.name,
                        email: data.email,
                        phone: data.phone || '',
                        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                        gender: data.gender || undefined,
                        contactAddress: data.contactAddress || '',
                        permanentAddress: data.permanentAddress || '',
                        nationalId: data.nationalId || '',
                        nationalIdPhotoUrl: data.nationalIdPhotoUrl || '',
                        idIssueDate: data.idIssueDate ? new Date(data.idIssueDate).toISOString().split('T')[0] : '',
                        idIssuePlace: data.idIssuePlace || '',
                        avatarUrl: data.avatarUrl || '',
                    });
                }
                setLoading(false);
            } else {
                setLoading(false);
            }
        };
        fetchAgent();
    }, [agentId, isNewMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChangeClick = () => {
        if (isViewMode) return;
        avatarInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isNewMode) {
                await createAgent(formData);
                toast({ title: "Success!", description: "Agent created successfully.", variant: 'success' });
            } else {
                if (!agentId) return;
                await updateUser(agentId, formData);
                toast({ title: "Success!", description: "Agent information updated.", variant: 'success' });
            }
            navigate('/admin/agents');
        } catch (error: any) {
            toast({ title: "Error", description: error.message || `Failed to ${isNewMode ? 'create' : 'update'} agent.`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="space-y-4 p-8"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
    }

    if (!isNewMode && !agent) {
        return <div className="p-8">Agent not found.</div>
    }

    return (
        <div className="space-y-6">
            <Link to="/admin/agents" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to Agents
            </Link>
             <form onSubmit={handleSubmit}>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{isNewMode ? t('addAgent') : isViewMode ? `${t('view')} Agent` : t('editAgent')}</CardTitle>
                        <CardDescription>
                             {isNewMode ? 'Enter details for the new agent.' : isViewMode ? `Viewing details for ${agent?.name}.` : `Update profile for ${agent?.name}.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Personal Information */}
                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">{t('personalInformation')}</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                                <input type="file" ref={avatarInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                <div className="relative">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-muted"/>
                                    ) : (
                                        <UserCircle2 className="w-24 h-24 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 w-full sm:w-auto">
                                    <Button type="button" variant="outline" onClick={handleAvatarChangeClick} disabled={isViewMode}>
                                        {t('change')}
                                    </Button>
                                    <CardDescription className="mt-2 text-xs">
                                        Select an image from your device.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('name')}</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isViewMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('email')}</Label>
                                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={!isNewMode || isViewMode} />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('phone')}</Label>
                                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={isViewMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob">{t('dob')}</Label>
                                    <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} disabled={isViewMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">{t('gender')}</Label>
                                    <Select id="gender" name="gender" value={formData.gender || ''} onChange={handleChange} disabled={isViewMode}>
                                        <option value="" disabled>Select Gender</option>
                                        <option value="Male">{t('male')}</option>
                                        <option value="Female">{t('female')}</option>
                                        <option value="Other">{t('other')}</option>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactAddress">{t('contactAddress')}</Label>
                                <Input id="contactAddress" name="contactAddress" value={formData.contactAddress} onChange={handleChange} disabled={isViewMode} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="permanentAddress">{t('permanentAddress')}</Label>
                                <Input id="permanentAddress" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} disabled={isViewMode} />
                            </div>
                        </div>
                        
                        {/* Identification Information */}
                        <div className="space-y-4">
                             <h3 className="text-lg font-semibold border-b pb-2">{t('identificationInformation')}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nationalId">{t('nationalId')}</Label>
                                    <Input id="nationalId" name="nationalId" value={formData.nationalId} onChange={handleChange} disabled={isViewMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idIssueDate">{t('idIssueDate')}</Label>
                                    <Input id="idIssueDate" name="idIssueDate" type="date" value={formData.idIssueDate} onChange={handleChange} disabled={isViewMode} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="idIssuePlace">{t('idIssuePlace')}</Label>
                                <Input id="idIssuePlace" name="idIssuePlace" value={formData.idIssuePlace} onChange={handleChange} disabled={isViewMode} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nationalIdPhotoUrl">{t('nationalIdPhoto')}</Label>
                                <div className="flex items-center gap-4">
                                    <Input id="nationalIdPhotoUrl" name="nationalIdPhotoUrl" placeholder="Enter image URL" value={formData.nationalIdPhotoUrl} onChange={handleChange} disabled={isViewMode} />
                                    {formData.nationalIdPhotoUrl && <img src={formData.nationalIdPhotoUrl} alt="ID Preview" className="h-16 rounded-md object-cover"/>}
                                </div>
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

export default EditAgentPage;