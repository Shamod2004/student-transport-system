import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        duration: 4200,
        classNames: {
          toast:
            "group toast rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-slate-800 shadow-[0_18px_42px_rgba(15,23,42,0.16)] backdrop-blur-xl",
          title: "font-semibold tracking-tight text-slate-900",
          description: "mt-1 text-slate-600",
          closeButton: "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700",
          actionButton: "rounded-lg bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800",
          cancelButton: "rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
