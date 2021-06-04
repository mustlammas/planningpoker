import {useRecoilState} from "recoil";
import Alert from '@material-ui/lab/Alert';
import React from "react";
import {errorsState} from "./state";
import {Box} from "@material-ui/core";

export const Errors = () => {
    const [errors] = useRecoilState(errorsState);
    return <Box style={{marginTop: "20px"}}>
        {errors.map((e, i) => <Alert severity="error" key={i}>{e}</Alert>)}
    </Box>;
};