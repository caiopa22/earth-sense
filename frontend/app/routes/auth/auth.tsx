import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  User,
} from "lucide-react";
import { cn } from "cn";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { authService } from "~/service/auth";

import Logo from "~/components/ui/logo";

export function meta() {
  return [
    { title: "Autenticação — EarthSense" },
    {
      name: "description",
      content: "Portal unificado de login e cadastro da plataforma EarthSense.",
    },
  ];
}

export default function AuthRoute() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // States para Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // States para Registro
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register" && !agreeTerms) {
      toast.add({
        title: "Atenção",
        description: "Por favor, aceite os termos de uso para criar sua conta.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        const response = await authService.login({
          email,
          password,
        });

        toast.add({
          title: "Login realizado",
          description: response.message || "Autenticado com sucesso! Redirecionando...",
          type: "success",
        });

        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        await authService.register({
          name: regName,
          email: regEmail,
          password: regPassword,
        });

        toast.add({
          title: "Conta criada",
          description: "Sua conta foi criada com sucesso! Você já pode acessar.",
          type: "success",
        });

        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setAgreeTerms(false);

        setTimeout(() => {
          setMode("login");
        }, 1000);
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;

      toast.add({
        title: mode === "login" ? "Falha no login" : "Falha no cadastro",
        description: message || "Não foi possível concluir a operação. Verifique os dados e tente novamente.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      {/* IMAGEM DE FUNDO COM SUAVE FADE DE TRANSIÇÃO */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Lavoura de milho e solo agrícola"
          className="w-full h-full object-cover opacity-85 dark:opacity-60 saturate-[1.1] transition-all duration-700"
        />
        {/* Overlays de fade suaves preservando a nitidez da foto */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/30 to-transparent" />
      </div>

      {/* HEADER MINIMALISTA */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <Logo />
        </Link>

        <ThemeToggle className="rounded-full border-border bg-background/50 backdrop-blur-md" />
      </header>

      {/* CONTEÚDO CENTRALIZADO — SEM CARDS, INTEGRADO AO DESIGN DA PÁGINA */}
      <main className="relative z-10 w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center flex-1">
        {/* SELETOR SEAMLESS ENTRAR / CADASTRAR */}
        <div className="flex items-center gap-1 p-1 bg-background/60 backdrop-blur-md border border-border/80 rounded-full w-fit mx-auto mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              mode === "login"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
              mode === "register"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Criar Conta
          </button>
        </div>

        <div className="space-y-1.5 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            {mode === "login" ? "Entrar no painel" : "Criar sua conta"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {mode === "login"
              ? "Informe seus dados para acompanhar o sensoriamento de solo em tempo real."
              : "Cadastre seu perfil para ter acesso à telemetria e pareceres do Earth Agent."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nome do pesquisador ou produtor"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required={mode === "register"}
                  className="h-11 rounded-full bg-background/80 backdrop-blur-md border-border/80 pl-10 focus-visible:ring-primary shadow-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={mode === "login" ? email : regEmail}
                onChange={(e) =>
                  mode === "login"
                    ? setEmail(e.target.value)
                    : setRegEmail(e.target.value)
                }
                required
                className="h-11 rounded-full bg-background/80 backdrop-blur-md border-border/80 pl-10 focus-visible:ring-primary shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              {mode === "login" && (
                <a
                  href="#esqueceu"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Instruções enviadas para o e-mail cadastrado.");
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Esqueceu a senha?
                </a>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={mode === "login" ? password : regPassword}
                onChange={(e) =>
                  mode === "login"
                    ? setPassword(e.target.value)
                    : setRegPassword(e.target.value)
                }
                required
                minLength={mode === "register" ? 6 : undefined}
                className="h-11 rounded-full bg-background/80 backdrop-blur-md border-border/80 pl-10 pr-10 focus-visible:ring-primary shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "login" ? (
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <Label
                htmlFor="remember"
                className="text-xs text-muted-foreground font-normal cursor-pointer select-none"
              >
                Lembrar desta sessão
              </Label>
            </div>
          ) : (
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(!!checked)}
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground font-normal cursor-pointer select-none leading-tight"
              >
                Concordo com os Termos de Uso e Política de Privacidade.
              </Label>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md shadow-primary/20 transition-all cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                {mode === "login" ? "Acessando..." : "Criando conta..."}
              </span>
            ) : mode === "login" ? (
              "Acessar Plataforma"
            ) : (
              "Criar Conta EarthSense"
            )}
          </Button>
        </form>

        {/* TOGGLE DA PARTE INFERIOR */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          {mode === "login" ? (
            <>
              Ainda não possui conta?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Cadastre-se aqui
              </button>
            </>
          ) : (
            <>
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Fazer login
              </button>
            </>
          )}
        </p>
      </main>

      {/* FOOTER DISCRETO */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground/80">
        EarthSense IoT & IA • Trabalho de Conclusão de Curso UNIP 2026
      </footer>
    </div>
  );
}
