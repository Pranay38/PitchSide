import { ReactNode } from "react";

interface SidebarSettingsProps {
    children: ReactNode;
}

export function SidebarSettings({ children }: SidebarSettingsProps) {
    return (
        <div className="flex flex-col gap-6">
            {children}
        </div>
    );
}
