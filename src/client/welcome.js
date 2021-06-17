import {useRecoilState} from "recoil";
import {sendMessage} from "./common";
import * as Msg from "../shared/messages";
import {Box, Button, TextField} from "@material-ui/core";
import React from "react";
import {userState, userSubmittedState} from "./state";

export const WelcomeScreen = ({roomId, client}) => {
    const [user, setUser] = useRecoilState(userState);
    const sendJoinMessage = () => sendMessage(client, Msg.JOIN, {
        username: user,
        room: roomId
    });
    const [submitted] = useRecoilState(userSubmittedState);
    const onEnter = (e) => {
        if(e.keyCode == 13) sendJoinMessage();
    };
    const isValidName = () => user && user.trim().length > 0;

    return submitted ? null :
        <div>
            <TextField onKeyDown={onEnter} autoFocus label="Your name" type="text" value={user} onChange={(e) => setUser(e.target.value)}/>
            <Box ml={1} display="inline">
                <Button color="primary" variant="contained" size="large" onClick={() => {
                    sendJoinMessage();
                }} disabled={!isValidName()}>Join</Button>
            </Box>
        </div>;
}