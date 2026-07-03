export type ThemeTypes = {
    name: string;
    dark: boolean;
    variables?: object;
    colors: {
        primary?: string;
        secondary?: string;
        info?: string;
        success?: string;
        accent?: string;
        warning?: string;
        error?: string;
        lightprimary?: string;
        lightsecondary?: string;
        lightsuccess?: string;
        lighterror?: string;
        lightinfo?: string;
        lightwarning?: string;
        textPrimary?: string;
        textSecondary?: string;
        borderColor?: string;
        hoverColor?: string;
        inputBorder?: string;
        containerBg?: string;
        surface?: string;
        'on-surface-variant'?: string;
        grey100?: string;
        grey200?: string;
        muted?:string;
        // Paleta suave/armónica exclusiva de gráficos (tintes más claros que los
        // semánticos de UI, para que los charts no se vean saturados ni "arcoíris").
        chartPrimary?: string;
        chartSecondary?: string;
        chartInfo?: string;
        chartSuccess?: string;
        chartWarning?: string;
        chartError?: string;
        chartAccent?: string;
        chartAmber?: string;
        chartGrey?: string;
    };
};
