import {useRecoilState} from "recoil";
import {Box} from "@material-ui/core";
import React from "react";
import {errorsState} from "./state";

export const Errors = () => {
    const [errors] = useRecoilState(errorsState);
    return <Box className="errors" color="secondary.main">
        {errors.map((e, i) => <Box key={i}>{e}</Box>)}
    </Box>;
};