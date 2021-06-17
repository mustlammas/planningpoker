import {useRecoilState, useRecoilValue} from "recoil";
import React from "react";
import {everyoneHasVoted} from "./common";
import {configState, votesState} from "./state";
import {Typography} from "@material-ui/core";

const calculateResult = (votes, options) => {
    if (everyoneHasVoted(votes)) {
        const participantVotes = votes.filter(v => !v.observer);

        if (participantVotes.length === 0) {
            return "?";
        }

        const conflictingVotes = participantVotes.filter(v => {
            const option = options.find(o => o.text === v.vote);
            if (option) {
                const conflicting = option.conflicting;
                return conflicting.find(c => {
                    return participantVotes.map(pv => pv.vote).find(pv => pv === c);
                });
            } else {
                return false;
            }
        });

        const votesWithIndexes = votes.map(v => {
            const option = options.find(o => o.text === v.vote);
            return {
                ...v,
                index: options.lastIndexOf(option),
                option: option
            };
        });
        votesWithIndexes.sort((a,b) => (a.index > b.index) ? 1 : ((b.index > a.index) ? -1 : 0));

        const largestConflictingVote = votesWithIndexes.filter(v => v.option && v.option.conflicting.length > 0).pop();
        const largestVote = votesWithIndexes.pop();

        if (conflictingVotes.length > 0) {
            return "Conflicting votes!";
        } else {
            return largestConflictingVote ? largestConflictingVote.vote : largestVote.vote;
        }
    } else {
        return "Waiting for votes...";
    }
};

export const Result = () => {
    const [votes] = useRecoilState(votesState);
    const config = useRecoilValue(configState);
    const options = config.template && config.template.options || [];

    return <Typography variant="h5" gutterBottom>
        {calculateResult(votes, options)}
    </Typography>;
};