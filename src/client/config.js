import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {configState} from "./state";
import React, {useState} from "react";
import * as Msg from "../shared/messages";
import {AppBar, Button, Chip, Dialog, makeStyles, TextField} from "@material-ui/core";
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

const ConfigModal = ({client}) => {
    const setConfiguring = useSetRecoilState(configuringState);
    const config = useRecoilValue(configState);
    const [options, setOptions] = useState([...config.options, {text: "", conflicting: []}]);

    const onSave = () => {
        const filtered = options.filter(o => o.text).map(o => {
            return {
                text: o.text,
                conflicting: o.conflicting
            };
        });
        sendMessage(client, Msg.UPDATE_CONFIG, filtered);
        setConfiguring(false);
    };

    const useStyles = makeStyles((theme) => ({
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        }
    }));

    const classes = useStyles();

    const handleClose = () => {
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

                            setOptions(newOptions);
                        };

                        const onRemove = () => {
                            const newOptions = [...options];
                            newOptions.splice(optIndex, 1);
                            setOptions(newOptions);
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

                                setOptions(newOptions);
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

                                setOptions(newOptions);
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
    const [configuring, setConfiguring] = useRecoilState(configuringState);

    return <>
        <Button onClick={() => setConfiguring(true)} size="large">
            <SettingsIcon color="disabled"/>
        </Button>
        {
            configuring && <ConfigModal client={client}/>
        }
    </>;
};