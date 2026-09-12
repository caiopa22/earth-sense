import { cn } from "cn";

interface LogoProps {
    className?: string;
}

const Logo = ({ className }: LogoProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 720 170"
            className={cn("h-14 w-auto shrink-0 select-none", className)}
            fill="none"
        >
            <defs>
                <linearGradient id="earthSenseDropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
            </defs>

            {/* Ícone da gota redimensionado para ficar proporcionalmente menor */}
            <g id="logo-symbol" transform="translate(10, 20) scale(0.65)">
                <path
                    d="M 72,12 C 72,12 24,76 24,108 C 24,134.5 45.5,156 72,156 C 98.5,156 120,134.5 120,108 C 120,76 72,12 72,12 Z"
                    fill="url(#earthSenseDropGrad)"
                />

                <path
                    d="M 72,36 C 72,36 52,78 52,106 C 52,118 61,128 72,132 C 67,118 69,96 77,76 C 74,62 72,36 72,36 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.95"
                />

                <circle cx="72" cy="106" r="5" fill="var(--primary)" />
            </g>

            {/* Textos da marca aumentados em destaque */}
            <g id="logo-text" transform="translate(125, 28)">
                <text
                    x="0"
                    y="66"
                    fontFamily="var(--font-heading), 'Inter', sans-serif"
                    fontSize="74"
                    fontWeight="700"
                    letterSpacing="-0.03em"
                    className="fill-foreground"
                >
                    Earth<tspan className="fill-primary" fontWeight="600">Sense</tspan>
                </text>

                <text
                    x="3"
                    y="108"
                    fontFamily="var(--font-sans), 'Inter', sans-serif"
                    fontSize="18"
                    fontWeight="600"
                    letterSpacing="0.24em"
                    className="fill-muted-foreground"
                >
                    SOIL MOISTURE INTELLIGENCE
                </text>
            </g>
        </svg>
    );
};

export default Logo;