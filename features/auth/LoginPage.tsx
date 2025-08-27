import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../hooks/useI18n";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Spinner } from "../../components/ui/Spinner";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "../../hooks/useToast";

const mockAccounts = [
  {
    email: "admin@example.com",
    role: "Admin",
    color: "bg-red-500 hover:bg-red-600",
  },
  {
    email: "agent@example.com",
    role: "Agent",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    email: "mentor@example.com",
    role: "Mentor",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    email: "student@example.com",
    role: "Student",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    email: "employee@example.com",
    role: "Employee",
    color: "bg-teal-500 hover:bg-teal-600",
  },
  {
    email: "company@example.com",
    role: "Company",
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    email: "school@example.com",
    role: "School",
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
];

function LoginPage(): React.ReactNode {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Passw0rd!"); // Dummy password
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: t("loginFailed"),
        description: t("loginFailedDesc"),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    toast({
      title: `${provider} Login`,
      description: `${provider} authentication is under development`,
      variant: "default",
    });
  };

  const handleDemoLogin = (account: (typeof mockAccounts)[0]) => {
    setEmail(account.email);
    setPassword("Passw0rd!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#a8edea] to-[#fed6e3]" style={{
        animation: 'gradientShift 6s ease-in-out infinite alternate'
      }}></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-[#fed6e3] to-[#a8edea] opacity-70" style={{
        animation: 'gradientShift 8s ease-in-out infinite alternate-reverse'
      }}></div>
      <style>{`
        @keyframes gradientShift {
          0% {
            background: linear-gradient(45deg, #f5f7fa , #c3cfe2);
          }
          25% {
            background: linear-gradient(90deg, #c3cfe2, #f5f7fa );
          }
          50% {
            background: linear-gradient(135deg, #f5f7fa , #c3cfe2);
          }
          75% {
            background: linear-gradient(180deg, #c3cfe2, #f5f7fa );
          }
          100% {
            background: linear-gradient(225deg, #f5f7fa , #c3cfe2);
          }
        }
      `}</style>
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Demo Accounts Card - Left Side */}
        <Card className="shadow-lg order-2 lg:order-1 lg:col-span-1 ">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription className="text-sm">Quick login</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockAccounts.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                className="w-full justify-start text-black bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                onClick={() => handleDemoLogin(account)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{account.role}</span>
                  <span className="text-xs text-gray-600">{account.email}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Login Form Card - Right Side */}
        <Card className="shadow-lg order-1 lg:order-2 lg:col-span-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <CardTitle className="text-xl">{t("welcome")}</CardTitle>
            <CardDescription className="text-sm">
              {t("loginToYourAccount")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    title="Remember me checkbox"
                    placeholder="Remember me"
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() =>
                    toast({
                      title: "Forgot Password",
                      description:
                        "Password reset feature is under development",
                    })
                  }
                >
                  Forgot password?
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={isLoading}
              >
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {t("login")}
              </Button>

              {/* Social Login Section */}
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or sign in with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-3">
                  {/* Google */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full hover:bg-gray-50"
                    onClick={() => handleOAuthLogin("Google")}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </Button>

                  {/* Facebook */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full hover:bg-gray-50"
                    onClick={() => handleOAuthLogin("Facebook")}
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="#1877F2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Sign in with Facebook
                  </Button>

                  {/* Zalo */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full hover:bg-gray-50 flex items-center justify-center gap-2"
                    onClick={() => handleOAuthLogin("Zalo")}
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/512px-Icon_of_Zalo.svg.png"
                      alt="Zalo"
                      className="h-4 w-4"
                    />
                    <span>Sign in with Zalo</span>
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
