import { createMuiTheme } from '@material-ui/core/styles';

export const defaultTheme =  createMuiTheme({
    palette:  {
        alternative: {
            main: '#fff'
        },
        secondary: {
            light: '#999',
            main: '#3f51b5',
            contrastText: '#ccc',
        },
    }
});

export const darkTheme = createMuiTheme({
    palette: {
        primary: {
            light: "#fff",
            main: '#777',
            dark: "#222",
            contrastText: '#fff',
        },
        secondary: {
            light: '#fff',
            main: '#222',
            dark: "#222",
            contrastText: '#fff',
        },
        alternative: {
            main: '#333',
        },
        background: {
            default: "#222",
            paper: "#333"
        },
        text: {
            primary: "#ccc",
            secondary: "#ccc",
            disabled: "#ccc",
            hint: "#ccc"
        },
        divider: "#ccc",
    },
    typography: {
        allVariants: {
            color: "#ccc"
        }
    },
    overrides: {
        MuiButton: {
            contained: {
                "&:disabled": {
                    color: "#888",
                    backgroundColor: "#444"
                },
                "&:hover": {
                    color: "#fff",
                    backgroundColor: "#000"
                }
            },
        },
        MuiInput: {
            underline: {
                '&:before': {
                    borderBottom: '2px solid #ccc'
                },
            }
        },
        MuiSvgIcon: {
            colorDisabled: {
                color: "#aaa"
            },
        }
    },
});