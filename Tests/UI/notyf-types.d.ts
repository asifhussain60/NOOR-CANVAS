/**
 * Type declarations for NOOR Canvas toast notification system
 */

interface NotyfConfig {
    duration: number;
    position: { x: string; y: string };
    dismissible: boolean;
    ripple: boolean;
    types?: Array<{
        type: string;
        background: string;
        icon?: {
            className: string;
            tagName: string;
            text: string;
        };
    }>;
}

interface NotyfInstance {
    success(message: string): void;
    error(message: string): void;
    open(config: { type: string; message: string; background?: string }): void;
}

interface NoorToastState {
    initAttempted: boolean;
    initSuccess: boolean;
    notyfInstance: boolean;
    notyfType: string;
    config: NotyfConfig;
}

interface NoorToastAPI {
    init(): boolean;
    show(message: string, title: string, type: string): void;
    getState(): NoorToastState;
}

declare global {
    interface Window {
        Notyf: new (config: NotyfConfig) => NotyfInstance;
        NoorToast: NoorToastAPI;
        showNoorToast: (message: string, title: string, type: string) => void;
    }
}

export { };

