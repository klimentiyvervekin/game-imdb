import { createGlobalStyle } from "styled-components";

const Variables = createGlobalStyle`
  :root {
    --color-bg: #ffffff;
    --color-surface: #ffffff;
    --color-text: #111827;
    --color-muted: #6b7280;
    --color-border: #e5e7eb;
    --color-border-strong: #d1d5db;

    --color-primary: #4f46e5;
    --color-primary-hover: #4338ca;

    --color-danger: #dc2626;
    --color-danger-hover: #b91c1c;

    --font-sm: 12px;
    --font-md: 14px;
    --font-lg: 22px;

    --space-2xs: 4px;
    --space-xs: 6px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 24px;
    --space-2xl: 40px;

    --radius-sm: 8px;
    --radius-md: 12px;

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
`;

export default Variables;
