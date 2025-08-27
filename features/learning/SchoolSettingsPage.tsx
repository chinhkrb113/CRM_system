
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../../hooks/useToast';
import { getUserById, updateUser, updateUserPassword, getSchools } from '../../services/mockApi';
import { User, School } from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { UserCircle2, Building, Mail, MapPin, Phone } from 'lucide-react';

function SchoolSettingsPage() {
    const { user, login } = useAuth(); // Using login to refresh user context
    const { t } = useI18n();
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [school, setSchool] = useState<School | null>(null);
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatarUrl: '',
    });
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                const [userData, allSchools] = await Promise.all([
                    getUserById(user.id),
                    getSchools()
                ]);

                setCurrentUser(userData);

                if (userData) {
                    setFormData({ 
                        name: userData.name,
                        phone: userData.phone || '',
                        avatarUrl: userData.avatarUrl || '',
                    });
                    
                    if (userData.schoolName) {
                        const schoolData = allSchools.find(s => s.name === userData.schoolName);
                        setSchool(schoolData || null);
                    }
                }
            }
        };
        fetchData();
    }, [user]);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChangeClick = () => {
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

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsSavingInfo(true);
        const updatedUser = await updateUser(currentUser.id, formData);
        if (updatedUser) {
            await login(updatedUser.email, 'Passw0rd!');
        }
        setIsSavingInfo(false);
        toast({
            title: "Success",
            description: "Your information has been updated.",
            variant: "success",
        });
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            toast({
                title: "Error",
                description: "New passwords do not match.",
                variant: "destructive",
            });
            return;
        }
        if (!user) return;
        setIsSavingPassword(true);
        await updateUserPassword(user.id, passwordData.new);
        setIsSavingPassword(false);
        setPasswordData({ current: '', new: '', confirm: '' });
        toast({
            title: "Success",
            description: "Your password has been changed successfully.",
            variant: "success",
        });
    };

    if (!currentUser) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('schoolSettings')}</h1>
                <p className="text-muted-foreground">Manage your school's profile and your account.</p>
            </div>
            
            {school && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('schoolInformation')}</CardTitle>
                        <CardDescription>{t('schoolInformationDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">{school.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <span>{school.contactEmail}</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span>{school.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span>{school.address}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleInfoSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('yourAdminProfile')}</CardTitle>
                        <CardDescription>{t('yourAdminProfileDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex flex-col sm:flex-row items-center gap-6 pt-2 pb-4 border-b">
                            <input type="file" ref={avatarInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <div className="relative">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-muted"/>
                                ) : (
                                    <UserCircle2 className="w-24 h-24 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 w-full sm:w-auto">
                                <Button type="button" variant="outline" onClick={handleAvatarChangeClick}>
                                    {t('change')}
                                </Button>
                                <CardDescription className="mt-2 text-xs">
                                    Select an image for your profile.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('fullName')}</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInfoChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input id="email" type="email" value={currentUser.email} disabled />
                                <CardDescription>Your email address is used for logging in and cannot be changed.</CardDescription>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="phone">{t('phone')}</Label>
                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInfoChange} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                         <Button type="submit" disabled={isSavingInfo}>
                             {isSavingInfo && <Spinner className="mr-2 h-4 w-4" />}
                            {t('save')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
            
            <form onSubmit={handlePasswordSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('changePassword')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current">{t('currentPassword')}</Label>
                            <Input id="current" name="current" type="password" value={passwordData.current} onChange={handlePasswordChange} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new">{t('newPassword')}</Label>
                                <Input id="new" name="new" type="password" value={passwordData.new} onChange={handlePasswordChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">{t('confirmNewPassword')}</Label>
                                <Input id="confirm" name="confirm" type="password" value={passwordData.confirm} onChange={handlePasswordChange} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                         <Button type="submit" disabled={isSavingPassword || !passwordData.new}>
                            {isSavingPassword && <Spinner className="mr-2 h-4 w-4" />}
                            {t('updatePassword')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

export default SchoolSettingsPage;
