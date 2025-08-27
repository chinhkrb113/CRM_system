import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../hooks/useI18n";
import { useToast } from "../../hooks/useToast";
import {
  getStudentById,
  updateStudent,
  updateUserPassword,
} from "../../services/mockApi";
import { Student, User } from "../../types";
import { Skeleton } from "../../components/ui/Skeleton";
import { Spinner } from "../../components/ui/Spinner";
import { Select } from "../../components/ui/Select";
import { UserCircle2 } from "lucide-react";

function StudentSettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dob: "",
    gender: undefined as User["gender"],
    contactAddress: "",
    permanentAddress: "",
    nationalId: "",
    nationalIdPhotoUrl: "",
    idIssueDate: "",
    idIssuePlace: "",
    avatarUrl: "",
  });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    const fetchStudent = async () => {
      if (user) {
        const data = await getStudentById(user.id);
        setStudent(data);
        if (data) {
          setFormData({
            name: data.name,
            phone: data.phone || "",
            dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
            gender: data.gender || undefined,
            contactAddress: data.contactAddress || "",
            permanentAddress: data.permanentAddress || "",
            nationalId: data.nationalId || "",
            nationalIdPhotoUrl: data.nationalIdPhotoUrl || "",
            idIssueDate: data.idIssueDate
              ? new Date(data.idIssueDate).toISOString().split("T")[0]
              : "",
            idIssuePlace: data.idIssuePlace || "",
            avatarUrl: data.avatarUrl || "",
          });
        }
      }
    };
    fetchStudent();
  }, [user]);

  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChangeClick = () => {
    avatarInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setIsSavingInfo(true);
    await updateStudent(student.id, formData);
    setIsSavingInfo(false);
    toast({
      title: "Success",
      description: "Your personal information has been updated.",
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
    setPasswordData({ current: "", new: "", confirm: "" });
    toast({
      title: "Success",
      description: "Your password has been changed successfully.",
      variant: "success",
    });
  };

  if (!student) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-white to-gray-300 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("information")}
        </h1>
        <p className="text-muted-foreground">
          Manage your account information and password.
        </p>
      </div>

      <form onSubmit={handleInfoSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("personalInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2 pb-4 border-b">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                aria-label="Upload avatar image"
                title="Choose an avatar image"
                placeholder="Select an image file"
              />
              <div className="relative">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-muted"
                  />
                ) : (
                  <UserCircle2 className="w-24 h-24 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarChangeClick}
                >
                  {t("change")}
                </Button>
                <CardDescription className="mt-2 text-xs">
                  Select an image from your device.
                </CardDescription>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("fullName")}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInfoChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={student.email} disabled />
                <CardDescription>
                  Your email address is used for logging in and cannot be
                  changed.
                </CardDescription>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInfoChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">{t("dob")}</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInfoChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">{t("gender")}</Label>
                <Select
                  id="gender"
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleInfoChange}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male">{t("male")}</option>
                  <option value="Female">{t("female")}</option>
                  <option value="Other">{t("other")}</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactAddress">{t("contactAddress")}</Label>
              <Input
                id="contactAddress"
                name="contactAddress"
                value={formData.contactAddress}
                onChange={handleInfoChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">{t("permanentAddress")}</Label>
              <Input
                id="permanentAddress"
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={handleInfoChange}
              />
            </div>
          </CardContent>
          <CardHeader>
            <CardTitle>{t("identificationInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId">{t("nationalId")}</Label>
                <Input
                  id="nationalId"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInfoChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idIssueDate">{t("idIssueDate")}</Label>
                <Input
                  id="idIssueDate"
                  name="idIssueDate"
                  type="date"
                  value={formData.idIssueDate}
                  onChange={handleInfoChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idIssuePlace">{t("idIssuePlace")}</Label>
              <Input
                id="idIssuePlace"
                name="idIssuePlace"
                value={formData.idIssuePlace}
                onChange={handleInfoChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalIdPhotoUrl">{t("nationalIdPhoto")}</Label>
              <Input
                id="nationalIdPhotoUrl"
                name="nationalIdPhotoUrl"
                placeholder="Enter image URL"
                value={formData.nationalIdPhotoUrl}
                onChange={handleInfoChange}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSavingInfo}>
              {isSavingInfo && <Spinner className="mr-2 h-4 w-4" />}
              {t("save")}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <form onSubmit={handlePasswordSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("changePassword")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">{t("currentPassword")}</Label>
              <Input
                id="current"
                name="current"
                type="password"
                value={passwordData.current}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new">{t("newPassword")}</Label>
                <Input
                  id="new"
                  name="new"
                  type="password"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("confirmNewPassword")}</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={passwordData.confirm}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              type="submit"
              disabled={isSavingPassword || !passwordData.new}
            >
              {isSavingPassword && <Spinner className="mr-2 h-4 w-4" />}
              {t("updatePassword")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default StudentSettingsPage;
