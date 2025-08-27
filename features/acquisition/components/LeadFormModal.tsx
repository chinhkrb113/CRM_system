
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Lead, LeadStatus, LeadTier, LeadClassification } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    lead: Partial<Lead> | null;
}

const assignees = ['Alice', 'Bob', 'Charlie', 'Agent Smith'];

function LeadFormModal({ isOpen, onClose, onSave, lead }: LeadFormModalProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '' as Lead['gender'],
        contactAddress: '',
        source: '',
        status: LeadStatus.NEW,
        tier: LeadTier.LOW,
        assigneeName: 'Alice',
        classification: LeadClassification.STUDENT,
    });

    useEffect(() => {
        const getInitialState = () => ({
            name: lead?.name || '',
            email: lead?.email || '',
            phone: lead?.phone || '',
            dob: lead?.dob ? new Date(lead.dob).toISOString().split('T')[0] : '',
            gender: lead?.gender || undefined,
            contactAddress: lead?.contactAddress || '',
            source: lead?.source || '',
            status: lead?.status || LeadStatus.NEW,
            tier: lead?.tier || LeadTier.LOW,
            assigneeName: lead?.assignee?.name || 'Alice',
            classification: lead?.classification || LeadClassification.STUDENT,
        });

        if (isOpen) {
            setFormData(getInitialState());
        }
    }, [lead, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                </DialogHeader>
                <DialogContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('name')}</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('email')}</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="phone">{t('phone')}</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">{t('dob')}</Label>
                            <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contactAddress">{t('contactAddress')}</Label>
                        <Input id="contactAddress" name="contactAddress" value={formData.contactAddress} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="source">{t('source')}</Label>
                        <Input id="source" name="source" value={formData.source} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gender">{t('gender')}</Label>
                            <Select id="gender" name="gender" value={formData.gender || ''} onChange={handleChange}>
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">{t('male')}</option>
                                <option value="Female">{t('female')}</option>
                                <option value="Other">{t('other')}</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classification">{t('leadClassification')}</Label>
                            <Select id="classification" name="classification" value={formData.classification} onChange={handleChange}>
                                {Object.values(LeadClassification).map(c => <option key={c} value={c}>{t(`classification${c.charAt(0)}${c.slice(1).toLowerCase()}`)}</option>)}
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">{t('status')}</Label>
                            <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="tier">{t('tier')}</Label>
                             <Select id="tier" name="tier" value={formData.tier} onChange={handleChange}>
                                {Object.values(LeadTier).map(tierValue => <option key={tierValue} value={tierValue}>{tierValue.charAt(0) + tierValue.slice(1).toLowerCase()}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assigneeName">{t('assignee')}</Label>
                             <Select id="assigneeName" name="assigneeName" value={formData.assigneeName} onChange={handleChange}>
                                {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                            </Select>
                        </div>
                    </div>
                </DialogContent>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="submit">{t('save')}</Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}

export default LeadFormModal;