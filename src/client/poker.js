import {useRecoilState, useRecoilValue} from "recoil";
import {configState, selectedPointsState, userState, votesState} from "./state";
import {everyoneHasVoted, sendMessage} from "./common";
import * as Msg from "../shared/messages";
import {Box, Button, Chip, Grid} from "@material-ui/core";
import {Config} from "./config";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import CheckIcon from "@material-ui/icons/Check";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import React from "react";

export const Poker = ({client}) => {
    const user = useRecoilValue(userState);
    const [selectedPoints, setSelectedPoints] = useRecoilState(selectedPointsState);
    const votes = useRecoilValue(votesState);
    const config = useRecoilValue(configState);

    const sendVote = (vote) => sendMessage(client, Msg.VOTE, {vote: vote});
    const resetVotes = () => {
        setSelectedPoints(undefined);
        sendMessage(client, Msg.RESET_VOTE);
    };
    const becomeObserver = () => {
        setSelectedPoints(undefined);
        sendMessage(client, Msg.BECOME_OBSERVER);
    };
    const becomeParticipant = () => sendMessage(client, Msg.BECOME_PARTICIPANT);
    const revealVotes = () => sendMessage(client, Msg.REVEAL_VOTES);

    const usersWithDiffingVotes = () => {
        if (everyoneHasVoted(votes) && config && config.options) {
            return votes
                .filter(v => !v.observer)
                .filter(v => {
                    let option = config.options.find(o => o.text === v.vote) || {text: "?", conflicting: []};
                    let conflictingVote = votes.find(v => {
                        return option.conflicting.includes(v.vote);
                    });

                    return conflictingVote ? true : false;
                }).map(v => v.username);
        } else {
            return [];
        }
    };

    const diffingUsers = usersWithDiffingVotes();
    const myVote = votes.find(v => v.username === user);
    const observer = myVote && myVote.observer;

    return config && config.template ? <Box>
        <Grid container justify="center">
            {config.template.options.map((option, i) => {
                let color = selectedPoints === option.text ? "secondary" : "primary";
                return <Box key={i} p={1} display="inline">
                    <Button color={color} variant="contained" size="large" disabled={observer} onClick={() => {
                        sendVote(option.text);
                        setSelectedPoints(option.text);
                    }}>{option.text}</Button>
                </Box>;
            })}
            <Box p={1} display="inline">
                <Config client={client}/>
            </Box>
        </Grid>
        <Box p={2} display="flex">
            <Box flexGrow={1}>
                <Box display="inline" ml={2}><Button variant="contained" onClick={() => resetVotes()}>Reset</Button></Box>
                <Box display="inline" ml={2}><Button variant="contained" onClick={() => revealVotes()}>Reveal</Button></Box>
            </Box>
            {observer && <Button variant="contained" onClick={() => becomeParticipant()}>Participate</Button>}
            {!observer && <Button variant="contained" onClick={() => becomeObserver()}>Observe</Button>}
        </Box>
        <Box p={2} width="300px" mx="auto">
            <TableContainer>
                <Table size="small" aria-label="a table">
                    <TableBody>
                        {votes.map((v, i) => {
                            let checkIcon = v.vote ? <CheckIcon/> : null
                            let style = diffingUsers.includes(v.username) ? {fontWeight: "bold", backgroundColor: "#ff7961"} : {fontWeight: "bold"};
                            let nameStyle = user === v.username ? {fontWeight: "bold"} : {};
                            let voteObject = config.template.options.find(o => o.text === v.vote) || {text: "?"};
                            let vote = v.observer ?
                                <Chip label="observer"/> :
                                everyoneHasVoted(votes) ?
                                    <Chip label={voteObject.text} style={style}/> :
                                    checkIcon;
                            return <TableRow key={i} style={{height: "50px"}}>
                                <TableCell align="left" style={nameStyle}>{v.username}</TableCell>
                                <TableCell align="right">{vote}</TableCell>
                            </TableRow>;
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    </Box> : null;
};