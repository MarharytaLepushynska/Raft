import {initials} from "@/components/workspaceExpenses/utils/initials.ts";

export function Avatar({name, src, size = 28}: {name: string; src?: string | null; size?: number}) {
    if (src) {
        return (
            <img
                className="we-avatar"
                style={{width: size, height: size}}
                src={src}
                alt={name}
                title={name}
            />
        );
    }
    return (
        <span
            className="we-avatar"
            style={{width: size, height: size, fontSize: size * 0.36}}
            title = {name}
        >
            {initials(name)}
        </span>
    );
}
