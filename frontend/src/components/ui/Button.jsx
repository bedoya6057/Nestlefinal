import { twMerge } from 'tailwind-merge';

export function Button({ className, variant = 'primary', ...props }) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-accent text-white hover:bg-blue-600 focus:ring-blue-500",
        secondary: "bg-secondary text-white hover:bg-slate-600 focus:ring-slate-500",
        outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-900",
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], className)}
            {...props}
        />
    );
}
