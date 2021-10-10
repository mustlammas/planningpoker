import { createMuiTheme } from '@material-ui/core/styles';

export const defaultTheme =  createMuiTheme({
    palette:  {
        alternative: {
            main: '#fff'
        }
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
        },
        MuiOutlinedInput: {
            input: {
                border: '1px solid #ccc',
                borderRadius: '4px'
            }
        },
        MuiSelect: {
            filled: {
                color: "#222",
                backgroundColor: "#ccc",
            },
            select: {
                "&:focus": {
                    color: "#222",
                    backgroundColor: "#ccc"
                },
            }
        },
        MuiInputLabel: {
            filled: {
                color: "#222"
            }
        },
        MuiChip: {
            outlined: {
                backgroundColor: "#ccc"
            }
        }
    },
});
