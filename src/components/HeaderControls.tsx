import { Moon, Sun, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export function HeaderControls() {
  const { t, lang, setLang } = useI18n();
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("kayan-theme", next ? "dark" : "light");
    setDark(next);
  };

  const toggleLang = async () => {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from("profiles").update({ language: next }).eq("id", data.user.id);
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5 font-semibold">
        <Languages className="size-4" />
        {t("lang.switch")}
      </Button>
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("theme.toggle")}>
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </div>
  );
}

export function Logo() {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">ك</span>
      {t("app.name")}
    </span>
  );
}
