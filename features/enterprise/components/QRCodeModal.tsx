

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { useI18n } from '../../../hooks/useI18n';
import { Copy } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
}

function QRCodeModal({ isOpen, onClose, url }: QRCodeModalProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        toast({
            title: t('linkCopied'),
            variant: 'success'
        });
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogHeader>
                <DialogTitle>{t('scanToCompleteTitle')}</DialogTitle>
                <DialogDescription>{t('scanToCompleteDesc')}</DialogDescription>
            </DialogHeader>
            <DialogContent className="flex flex-col items-center gap-4">
                <img src={qrCodeApiUrl} alt="Interview Completion QR Code" width="200" height="200" />
                <div className="w-full space-y-2">
                    <Label htmlFor="qr-url">{t('completionLink')}</Label>
                    <div className="flex items-center gap-2">
                        <Input id="qr-url" value={url} readOnly />
                        <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
            <DialogFooter>
                <Button type="button" onClick={onClose}>Close</Button>
            </DialogFooter>
        </Dialog>
    );
}

export default QRCodeModal;
