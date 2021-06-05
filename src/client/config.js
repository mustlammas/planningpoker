import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {configState} from "./state";
import React from "react";
import * as Msg from "../shared/messages";
import {
    AppBar,
    Button,
    Chip,
    Dialog, FormControl, InputLabel,
    List,
    makeStyles, MenuItem, Select,
    TextField
} from "@material-ui/core";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import SettingsIcon from "@material-ui/icons/Settings";
import {sendMessage} from "./common";

const configuringState = atom({
    key: 'configuring',
    default: false
});

const originalConfigState = atom({
    key: 'originalConfigState',
    default: undefined
});

const useStyles = makeStyles((theme) => ({
    appBar: {
        position: 'relative',
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 200,

    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

const TemplateSelector = () => {
    const [config, setConfig] = useRecoilState(configState);
    const classes = useStyles();

    const setTemplate = (template) => {
        setConfig({
            ...config,
            template: config.templates.find(t => t.name === template)
        });
    };

    return <List>
        <FormControl variant="filled" className={classes.formControl}>
            <InputLabel>Template</InputLabel>
            <Select
                value={config.template.name}
                onChange={(e) => setTemplate(e.target.value)}
                inputProps={{
                    name: 'template'
                }}
            >
                {
                    config.templates.map((t, i) => <MenuItem key={i} value={t.name}>{t.name}</MenuItem>)
                }
            </Select>
        </FormControl>
    </List>;
};

const ConfigModal = ({client}) => {
    const setConfiguring = useSetRecoilState(configuringState);
    const [config, setConfig] = useRecoilState(configState);
    const originalConfig = useRecoilValue(originalConfigState);
    const classes = useStyles();

    const options =
        config.template.options.length === 0 ||
        config.template.options[config.template.options.length - 1].text.trim() === "" ?
            config.template.options :
            [...config.template.options, {text: "", conflicting: []}];

    const onSave = () => {
        const filtered = options.filter(o => o.text).map(o => {
            return {
                text: o.text,
                conflicting: o.conflicting
            };
        });
        sendMessage(client, Msg.UPDATE_CONFIG, {
            ...config.template,
            options: filtered
        });
        setConfiguring(false);
    };

    const handleClose = () => {
        setConfig(originalConfig);
        setConfiguring(false);
    };

    return <Dialog fullScreen open={true} onClose={handleClose}>
        <AppBar className={classes.appBar}>
            <Toolbar>
                <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
                <Typography variant="h6" className={classes.title}>
                    Options
                </Typography>
                <Button autoFocus color="inherit" onClick={onSave}>
                    Save
                </Button>
            </Toolbar>
        </AppBar>
        <TableContainer component={Paper}>
            <TemplateSelector/>
            <Table aria-label="Options table" size="small">
                <TableHead>
                    <TableRow width="10rem">
                        <TableCell>Label</TableCell>
                        <TableCell>Conflicting options</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {options.map((option, optIndex) => {
                        const onTextChange = (e) => {
                            const newText = e.target.value;
                            const newOptions = [...options];
                            const oldOption = newOptions[optIndex];
                            const newOption = {
                                ...oldOption,
                                text: newText
                            };

                            newOptions.splice(optIndex, 1, newOption);

                            const lastOption = newOptions[newOptions.length - 1];
                            if (lastOption.text) {
                                newOptions.push({text: "", value: "", conflicting: []});
                            }

                            setConfig({
                                ...config,
                                template: {
                                    ...config.template,
                                    options: newOptions
                                }
                            });
                        };

                        const updateConfig = (options) => {
                            const customTemplate = config.templates.find(t => t.name === "Custom");
                            if (customTemplate) {
                                const newCustomTemplate = {
                                    ...customTemplate,
                                    options: options
                                };
                                const newTemplates = [...config.templates];
                                newTemplates.splice(config.templates.indexOf(customTemplate), 1, newCustomTemplate);
                                setConfig({
                                    ...config,
                                    template: newCustomTemplate,
                                    templates: newTemplates
                                });
                            } else {
                                const newCustomTemplate = {
                                    name: "Custom",
                                    options: options
                                };
                                setConfig({
                                    ...config,
                                    template: newCustomTemplate,
                                    templates: [
                                        ...config.templates,
                                        newCustomTemplate
                                    ]
                                });
                            }
                        };

                        const onRemove = () => {
                            const newOptions = [...options];
                            newOptions.splice(optIndex, 1);
                            updateConfig(newOptions);
                        };

                        const toggleConflicting = (text, i, oIndex) => {
                            const isConflicting = option.conflicting.includes(text);
                            if (isConflicting) {
                                const copy = option.conflicting.filter(c => c !== text);
                                const optionCopy = {...option};
                                optionCopy.conflicting = copy;
                                const newOptions = [...options];
                                newOptions.splice(oIndex, 1, optionCopy);

                                const otherOption = options.find(o => o.text === text);
                                const otherOptionIndex = options.indexOf(otherOption);
                                const otherCopy = otherOption.conflicting.filter(c => c !== option.text);
                                const otherOptionCopy = {...otherOption};
                                otherOptionCopy.conflicting = otherCopy;
                                newOptions.splice(otherOptionIndex, 1, otherOptionCopy);

                                updateConfig(newOptions);
                            } else {
                                const copy = [...option.conflicting];
                                copy.splice(i, 0, text);
                                const optionCopy = {...option};
                                optionCopy.conflicting = copy;
                                const newOptions = [...options];
                                newOptions.splice(oIndex, 1, optionCopy);

                                const otherOption = options.find(o => o.text === text);
                                const otherOptionIndex = options.indexOf(otherOption);
                                const otherCopy = [...otherOption.conflicting];
                                otherCopy.splice(i, 0, option.text);
                                const otherOptionCopy = {...otherOption};
                                otherOptionCopy.conflicting = otherCopy;
                                newOptions.splice(otherOptionIndex, 1, otherOptionCopy);

                                updateConfig(newOptions);
                            }
                        };

                        const hasLabel = option.text.trim() !== "";

                        return <TableRow key={optIndex}>
                            <TableCell>
                                <TextField variant="outlined" size="small" value={option.text} onChange={onTextChange}/>
                            </TableCell>
                            <TableCell>
                                {
                                    hasLabel && options.filter(o => o.text.trim() !== "").map((o, i) => {
                                        const isThisOption = o.text === option.text;
                                        const style = isThisOption ?
                                            {} :
                                            option.conflicting.includes(o.text) ?
                                                {backgroundColor: "#ff7961"} :
                                                {}
                                        const variant = isThisOption ? "default" : "outlined";
                                        return <Chip
                                            key={i}
                                            label={o.text}
                                            disabled={isThisOption}
                                            onClick={() => toggleConflicting(o.text, i, optIndex)}
                                            variant={variant}
                                            style={style}
                                        />;
                                    })
                                }
                            </TableCell>
                            <TableCell align="right">
                                {
                                    option.text && <Button onClick={onRemove}>Remove</Button>
                                }
                            </TableCell>
                        </TableRow>;
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    </Dialog>;
};

export const Config = ({client}) => {
    const config = useRecoilValue(configState);
    const [configuring, setConfiguring] = useRecoilState(configuringState);
    const setOriginalConfig = useSetRecoilState(originalConfigState);
    const onStartConfiguring = () => {
        setOriginalConfig(config);
        setConfiguring(true);
    };

    return <>
        <Button onClick={onStartConfiguring} size="large">
            <SettingsIcon color="disabled"/>
        </Button>
        {
            configuring && <ConfigModal client={client}/>
        }
    </>;
};